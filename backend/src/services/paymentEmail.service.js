const db = require("../config/db");
const { sendMail } = require("../utils/mailer");

const BUSINESS_DETAILS = {
  name: "Poddo Playhouse",
  logoUrl:
    "https://res.cloudinary.com/du6mnjqdn/image/upload/v1775075925/images_qw2txg.png",
  address: "161/2 Sri Gnanendra Mawatha, Nawala, Sri Lanka",
  phone: "075 117 9443",
  email: "hello@poddoplayhouse.com",
};

const BUSINESS_BANK_DETAILS = {
  accountName: "Poddo Playhouse",
  accountNumber: "0880456789",
  bankName: "Commercial Bank",
  branchName: "Nawala Branch",
};

function parseDateSafe(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(dateValue) {
  const date = parseDateSafe(dateValue);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  }).format(date);
}

function formatDateOnly(dateValue) {
  const date = parseDateSafe(dateValue);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-LK", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "Asia/Colombo",
  }).format(date);
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function compactLines(lines) {
  return lines
    .map((line) => String(line ?? "").trim())
    .filter(Boolean);
}

function formatPaymentMethodLabel(method) {
  const map = {
    CASH: "Cash",
    CARD: "Card",
    BANK_TRANSFER: "Bank Transfer",
  };
  return map[String(method || "").toUpperCase()] || method || "-";
}

function formatBookingTypeLabel(type) {
  const map = {
    PLAY_AREA: "Play Area Booking",
    PARTY: "Party Area Booking",
    EVENT: "Event Booking",
    CLASS: "Class Booking",
  };
  return map[String(type || "").toUpperCase()] || "Booking";
}

async function getPaymentEmailContext(paymentId) {
  const [rows] = await db.query(
    `SELECT
       p.id,
       p.payment_no,
       p.parent_user_id,
       p.enrollment_id,
       p.booking_id,
       p.amount,
       p.payment_method,
       p.payment_status,
       p.reference_no,
       p.transaction_ref,
       p.notes,
       p.confirmed_at,
       p.created_at,
       u.full_name AS parent_name,
       u.email AS parent_email,
       u.phone AS parent_phone,
       b.booking_type,
       b.booking_date,
       b.time_slot,
       b.status AS booking_status,
       b.notes AS booking_notes,
       e.status AS enrollment_status,
       c.full_name AS child_name,
       cl.title AS class_title
     FROM payments p
     JOIN users u ON u.id = p.parent_user_id
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN enrollments e ON e.id = p.enrollment_id
     LEFT JOIN children c ON c.id = e.child_id
     LEFT JOIN classes cl ON cl.id = e.class_id
     WHERE p.id = ?
     LIMIT 1`,
    [paymentId]
  );

  if (!rows.length) {
    throw new Error("Payment email context not found");
  }

  const ctx = rows[0];

  if (!ctx.parent_email) {
    throw new Error("Customer email address is missing for this payment");
  }

  return ctx;
}

function buildBillToLines(ctx) {
  return compactLines([ctx.parent_name, ctx.parent_email, ctx.parent_phone]);
}

function buildPaymentMethodLines(ctx, documentType) {
  const method = String(ctx.payment_method || "").toUpperCase();

  if (method === "BANK_TRANSFER") {
    if (documentType === "invoice") {
      return compactLines([
        BUSINESS_BANK_DETAILS.bankName,
        `Account Name: ${BUSINESS_BANK_DETAILS.accountName}`,
        `Account No: ${BUSINESS_BANK_DETAILS.accountNumber}`,
        BUSINESS_BANK_DETAILS.branchName,
      ]);
    }

    return compactLines([
      "Bank Transfer",
      ctx.reference_no ? `Reference: ${ctx.reference_no}` : "Reference: -",
      BUSINESS_BANK_DETAILS.bankName,
      BUSINESS_BANK_DETAILS.branchName,
    ]);
  }

  if (method === "CARD") {
    return compactLines([
      "Card Payment",
      "Paid online",
      `Reference: ${ctx.transaction_ref || ctx.reference_no || ctx.payment_no || "-"}`,
    ]);
  }

  return compactLines([
    "Cash Payment",
    documentType === "invoice" ? "Pay at reception" : "Paid at reception",
    BUSINESS_DETAILS.phone,
  ]);
}

function buildItemTitle(ctx) {
  if (ctx.enrollment_id) {
    return ctx.class_title
      ? `Class Enrollment - ${ctx.class_title}`
      : "Class Enrollment";
  }

  if (ctx.booking_id) {
    return formatBookingTypeLabel(ctx.booking_type);
  }

  return "Payment";
}

function buildItemDescriptionLines(ctx) {
  const lines = [];

  if (ctx.enrollment_id) {
    lines.push(`Enrollment ID: ${ctx.enrollment_id}`);
    if (ctx.child_name) lines.push(`Child: ${ctx.child_name}`);
    if (ctx.class_title) lines.push(`Class: ${ctx.class_title}`);
  }

  if (ctx.booking_id) {
    lines.push(`Booking ID: ${ctx.booking_id}`);
    if (ctx.booking_type) lines.push(`Type: ${formatBookingTypeLabel(ctx.booking_type)}`);
    if (ctx.booking_date) lines.push(`Date: ${formatDateOnly(ctx.booking_date)}`);
    if (ctx.time_slot) lines.push(`Time: ${ctx.time_slot}`);
  }

  if (!ctx.enrollment_id && !ctx.booking_id) {
    lines.push(`Payment Method: ${formatPaymentMethodLabel(ctx.payment_method)}`);
  }

  return compactLines(lines);
}

function buildItems(ctx) {
  return [
    {
      no: 1,
      title: buildItemTitle(ctx),
      descriptionLines: buildItemDescriptionLines(ctx),
      price: Number(ctx.amount || 0),
      qty: 1,
      total: Number(ctx.amount || 0),
    },
  ];
}

function renderPartyLines(lines, { firstBold = true } = {}) {
  return lines
    .map((line, index) => {
      const isPrimary = firstBold && index === 0;
      return `<div style="font-size:${isPrimary ? 18 : 16}px; line-height:1.55; color:#111111; font-weight:${isPrimary ? 700 : 500};">${escapeHtml(line)}</div>`;
    })
    .join("");
}

function renderRightMeta(rows) {
  return rows
    .map(
      ([label, value]) => `
        <div style="font-size:16px; line-height:1.55; color:#555555;">
          <span style="font-weight:500;">${escapeHtml(label)}:</span>
          <span>${escapeHtml(value)}</span>
        </div>`
    )
    .join("");
}

function renderItemsTable(items) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:34px;">
      <thead>
        <tr>
          <th align="left" style="padding:0 14px 18px 0; font-size:18px; font-weight:800; color:#111111; text-transform:uppercase;">No</th>
          <th align="left" style="padding:0 14px 18px 0; font-size:18px; font-weight:800; color:#111111; text-transform:uppercase;">Item Description</th>
          <th align="right" style="padding:0 14px 18px 0; font-size:18px; font-weight:800; color:#111111; text-transform:uppercase;">Price</th>
          <th align="right" style="padding:0 14px 18px 0; font-size:18px; font-weight:800; color:#111111; text-transform:uppercase;">Qty</th>
          <th align="right" style="padding:0; font-size:18px; font-weight:800; color:#111111; text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
              <tr>
                <td valign="top" style="padding:10px 14px 18px 0; font-size:18px; color:#111111;">${escapeHtml(item.no)}</td>
                <td valign="top" style="padding:10px 14px 18px 0;">
                  <div style="font-size:18px; line-height:1.45; font-weight:600; color:#111111;">${escapeHtml(item.title)}</div>
                  ${item.descriptionLines
                    .map(
                      (line) => `<div style="font-size:14px; line-height:1.5; color:#5f5f5f;">${escapeHtml(line)}</div>`
                    )
                    .join("")}
                </td>
                <td valign="top" align="right" style="padding:10px 14px 18px 0; font-size:18px; color:#111111; white-space:nowrap;">${escapeHtml(
                  formatMoney(item.price)
                )}</td>
                <td valign="top" align="right" style="padding:10px 14px 18px 0; font-size:18px; color:#111111; white-space:nowrap;">${escapeHtml(
                  item.qty
                )}</td>
                <td valign="top" align="right" style="padding:10px 0 18px 0; font-size:18px; color:#111111; white-space:nowrap;">${escapeHtml(
                  formatMoney(item.total)
                )}</td>
              </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSummary(amount) {
  const formattedAmount = formatMoney(amount);

  return `
    <table role="presentation" width="48%" align="right" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:10px;">
      <tr>
        <td colspan="2" style="border-top:2px solid #111111; height:18px; font-size:0; line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:6px 0; font-size:18px; color:#111111;">Total</td>
        <td align="right" style="padding:6px 0; font-size:18px; color:#111111; white-space:nowrap;">${escapeHtml(
          formattedAmount
        )}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; font-size:18px; color:#111111;">Tax</td>
        <td align="right" style="padding:6px 0; font-size:18px; color:#111111;">-</td>
      </tr>
      <tr>
        <td style="padding:6px 0 12px 0; font-size:18px; color:#111111;">Discount</td>
        <td align="right" style="padding:6px 0 12px 0; font-size:18px; color:#111111;">-</td>
      </tr>
      <tr>
        <td colspan="2" style="border-top:2px solid #111111; height:18px; font-size:0; line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:6px 0 0 0; font-size:20px; font-weight:600; color:#111111;">Sub Total</td>
        <td align="right" style="padding:6px 0 0 0; font-size:20px; font-weight:600; color:#111111; white-space:nowrap;">${escapeHtml(
          formattedAmount
        )}</td>
      </tr>
    </table>
  `;
}

function renderDocumentLayout({
  documentTitle,
  rightMetaRows,
  billToLines,
  paymentMethodLines,
  items,
  summaryAmount,
  footerMessage,
  notes,
}) {
  return `
    <div style="background:#efefef; padding:28px 14px; font-family:Arial, Helvetica, sans-serif; color:#111111;">
      <div style="max-width:980px; margin:0 auto; background:#efefef; padding:20px 34px 34px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td valign="top" width="58%" style="padding-right:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td valign="middle" style="padding-right:12px;">
                    <img src="${escapeHtml(BUSINESS_DETAILS.logoUrl)}" alt="${escapeHtml(
    BUSINESS_DETAILS.name
  )}" style="height:42px; display:block;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size:22px; line-height:1.2; font-weight:700; color:#111111;">${escapeHtml(
                      BUSINESS_DETAILS.name
                    )}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:18px; font-size:16px; line-height:1.55; color:#444444;">
                <div>${escapeHtml(BUSINESS_DETAILS.address)}</div>
                <div>${escapeHtml(BUSINESS_DETAILS.phone)}</div>
                <div>${escapeHtml(BUSINESS_DETAILS.email)}</div>
              </div>
            </td>
            <td valign="top" width="42%" align="right">
              <div style="font-size:34px; line-height:1.1; font-weight:800; letter-spacing:0.4px; color:#111111; text-transform:uppercase; margin-bottom:14px;">${escapeHtml(
                documentTitle
              )}</div>
              ${renderRightMeta(rightMetaRows)}
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:74px;">
          <tr>
            <td valign="top" width="58%" style="padding-right:18px;">
              <div style="font-size:18px; font-weight:800; text-transform:uppercase; color:#111111; margin-bottom:12px;">Bill To:</div>
              ${renderPartyLines(billToLines)}
            </td>
            <td valign="top" width="42%" align="right">
              <div style="font-size:18px; font-weight:800; color:#111111; margin-bottom:12px;">Payment Method</div>
              ${renderPartyLines(paymentMethodLines)}
            </td>
          </tr>
        </table>

        ${renderItemsTable(items)}

        ${renderSummary(summaryAmount)}

        <div style="clear:both;"></div>

        ${
          notes
            ? `<div style="margin-top:34px; padding:16px 18px; border:1px solid #d8d8d8; background:#f7f7f7;">
                 <div style="font-size:16px; font-weight:700; color:#111111; margin-bottom:8px;">Notes</div>
                 <div style="font-size:15px; line-height:1.6; color:#444444;">${nl2br(notes)}</div>
               </div>`
            : ""
        }

        <div style="margin-top:34px; font-size:15px; line-height:1.6; color:#444444;">
          ${escapeHtml(footerMessage)}
        </div>
      </div>
    </div>
  `;
}

function getInvoiceMeta(ctx) {
  if (String(ctx.payment_method || "").toUpperCase() === "BANK_TRANSFER") {
    return {
      subject: `Invoice ${ctx.payment_no} - Bank transfer submitted`,
      footerMessage:
        "Your bank transfer has been submitted and is now pending receptionist verification. Once approved, this payment will be marked as completed and your receipt will be sent automatically.",
      rightMetaRows: [
        ["Invoice Number", ctx.payment_no || "-"],
        ["Date", formatDateOnly(ctx.created_at)],
        ["Status", "Pending Verification"],
      ],
    };
  }

  return {
    subject: `Invoice ${ctx.payment_no} - Cash payment pending`,
    footerMessage:
      "Please present this invoice reference at reception to complete the cash payment. Your receipt will be emailed after the receptionist confirms the payment.",
    rightMetaRows: [
      ["Invoice Number", ctx.payment_no || "-"],
      ["Date", formatDateOnly(ctx.created_at)],
      ["Status", "Pending Payment"],
    ],
  };
}

function getReceiptMeta(ctx) {
  if (String(ctx.payment_method || "").toUpperCase() === "BANK_TRANSFER") {
    return {
      subject: `Receipt ${ctx.payment_no} - Bank transfer confirmed`,
      footerMessage:
        "We have verified your bank transfer successfully. This email now serves as your official payment receipt.",
      rightMetaRows: [
        ["Receipt Number", ctx.payment_no || "-"],
        ["Date", formatDateOnly(ctx.created_at)],
        ["Confirmed", formatDateTime(ctx.confirmed_at || new Date())],
      ],
    };
  }

  return {
    subject: `Receipt ${ctx.payment_no} - Cash payment confirmed`,
    footerMessage:
      "Your cash payment has been confirmed successfully at reception. This email serves as your official payment receipt.",
    rightMetaRows: [
      ["Receipt Number", ctx.payment_no || "-"],
      ["Date", formatDateOnly(ctx.created_at)],
      ["Confirmed", formatDateTime(ctx.confirmed_at || new Date())],
    ],
  };
}

async function sendInvoiceEmailByPaymentId(paymentId) {
  const ctx = await getPaymentEmailContext(paymentId);
  const meta = getInvoiceMeta(ctx);

  await sendMail({
    to: ctx.parent_email,
    subject: meta.subject,
    html: renderDocumentLayout({
      documentTitle: "Invoice",
      rightMetaRows: meta.rightMetaRows,
      billToLines: buildBillToLines(ctx),
      paymentMethodLines: buildPaymentMethodLines(ctx, "invoice"),
      items: buildItems(ctx),
      summaryAmount: Number(ctx.amount || 0),
      footerMessage: meta.footerMessage,
      notes: ctx.booking_notes || ctx.notes,
    }),
  });
}

async function sendReceiptEmailByPaymentId(paymentId) {
  const ctx = await getPaymentEmailContext(paymentId);
  const meta = getReceiptMeta(ctx);

  await sendMail({
    to: ctx.parent_email,
    subject: meta.subject,
    html: renderDocumentLayout({
      documentTitle: "Receipt",
      rightMetaRows: meta.rightMetaRows,
      billToLines: buildBillToLines(ctx),
      paymentMethodLines: buildPaymentMethodLines(ctx, "receipt"),
      items: buildItems(ctx),
      summaryAmount: Number(ctx.amount || 0),
      footerMessage: meta.footerMessage,
      notes: ctx.booking_notes || ctx.notes,
    }),
  });
}

async function sendCardPaymentInvoiceAndReceiptEmailByPaymentId(paymentId) {
  const ctx = await getPaymentEmailContext(paymentId);

  await sendMail({
    to: ctx.parent_email,
    subject: `Invoice and Receipt ${ctx.payment_no} - Card payment successful`,
    html: renderDocumentLayout({
      documentTitle: "Invoice & Receipt",
      rightMetaRows: [
        ["Invoice Number", ctx.payment_no || "-"],
        ["Receipt Number", ctx.payment_no || "-"],
        ["Confirmed", formatDateTime(ctx.confirmed_at || new Date())],
      ],
      billToLines: buildBillToLines(ctx),
      paymentMethodLines: buildPaymentMethodLines(ctx, "receipt"),
      items: buildItems(ctx),
      summaryAmount: Number(ctx.amount || 0),
      footerMessage:
        "Your card payment was completed successfully in real time. This email serves as both your invoice and your payment receipt.",
      notes: ctx.booking_notes || ctx.notes,
    }),
  });
}

module.exports = {
  sendInvoiceEmailByPaymentId,
  sendReceiptEmailByPaymentId,
  sendCardPaymentInvoiceAndReceiptEmailByPaymentId,
};