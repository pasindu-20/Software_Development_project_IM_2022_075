const db = require("../config/db");
const { sendMail } = require("../utils/mailer");

function formatDateTime(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);

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
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);

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

function buildCommonRows(ctx) {
    const rows = [
        ["Document Ref", ctx.payment_no || "-"],
        ["Customer", ctx.parent_name || "-"],
        ["Email", ctx.parent_email || "-"],
        ["Payment Method", ctx.payment_method || "-"],
        ["Amount", formatMoney(ctx.amount)],
        ["Payment Status", ctx.payment_status || "-"],
        ["Created At", formatDateTime(ctx.created_at)],
    ];

    if (ctx.booking_id) {
        rows.push(["Booking ID", ctx.booking_id]);
        rows.push(["Booking Type", ctx.booking_type || "-"]);
        rows.push(["Booking Date", formatDateOnly(ctx.booking_date)]);
        rows.push(["Time Slot", ctx.time_slot || "-"]);
    }

    if (ctx.enrollment_id) {
        rows.push(["Enrollment ID", ctx.enrollment_id]);
        rows.push(["Class", ctx.class_title || "-"]);
        rows.push(["Child", ctx.child_name || "-"]);
    }

    if (ctx.reference_no) {
        rows.push(["Reference No", ctx.reference_no]);
    }

    return rows;
}

function renderTable(rows) {
    return `
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tbody>
        ${rows
            .map(
                ([label, value]) => `
              <tr>
                <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; width:34%; font-weight:700;">${escapeHtml(label)}</td>
                <td style="padding:10px 12px; border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
              </tr>`
            )
            .join("")}
      </tbody>
    </table>
  `;
}

function renderLayout({ title, introHtml, rows, footerHtml, notes }) {

    return `
    <div style="background:#f4f6f8; padding:24px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
      <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg, #f693e0 0%, #f4c2f2 100%); color:#ffffff; padding:26px 28px;">
        <img 
        src="https://res.cloudinary.com/du6mnjqdn/image/upload/v1775075925/images_qw2txg.png" 
        alt="Logo" 
        style="height:48px; margin-bottom:10px;" 
        />
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; opacity:0.9;">Poddo Playhouse</div>
          <div style="font-size:13px; opacity:0.92; margin-top:4px;">${escapeHtml(title)}</div>
        </div>

        <div style="padding:24px;">
          ${introHtml}
          ${renderTable(rows)}
          ${notes
            ? `<div style="margin-top:16px; padding:14px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;"><div style="font-weight:700; margin-bottom:8px;">Notes</div><div>${nl2br(notes)}</div></div>`
            : ""
        }
          <div style="margin-top:18px; font-size:14px; line-height:1.7; color:#4b5563;">${footerHtml}</div>
        </div>
      </div>
    </div>
  `;
}

function getInvoiceMeta(ctx) {
    if (ctx.payment_method === "BANK_TRANSFER") {
        return {
            subject: `Invoice ${ctx.payment_no} - Bank transfer submitted`,
            introHtml: `
        <p>Hi ${escapeHtml(ctx.parent_name || "Customer")},</p>
        <p>Your invoice has been created and your bank transfer submission has been received.</p>
        <p>Your payment is currently <strong>Pending Verification</strong>. Our receptionist will verify the transfer and send your receipt after approval.</p>
      `,
            footerHtml:
                "Please keep your payment reference safe. Once the bank transfer is verified, you will receive a email.",
        };
    }

    return {
        subject: `Invoice ${ctx.payment_no} - Cash payment pending`,
        introHtml: `
      <p>Hi ${escapeHtml(ctx.parent_name || "Customer")},</p>
      <p>Your invoice has been created successfully.</p>
      <p>Your payment method is <strong>Cash</strong>. Please make the payment at reception to complete the process. Your receipt will be emailed after the payment is confirmed by reception.</p>
    `,
        footerHtml:
            "Please present this invoice reference at reception when making your payment.",
    };
}

function getReceiptMeta(ctx) {
    if (ctx.payment_method === "BANK_TRANSFER") {
        return {
            subject: `Receipt ${ctx.payment_no} - Bank transfer confirmed`,
            introHtml: `
        <p>Hi ${escapeHtml(ctx.parent_name || "Customer")},</p>
        <p>We have verified your bank transfer successfully.</p>
        <p>Your payment has now been confirmed and this email serves as your receipt.</p>
      `,
            footerHtml:
                "Thank you. Your booking or enrollment is now confirmed in the system.",
        };
    }

    return {
        subject: `Receipt ${ctx.payment_no} - Cash payment confirmed`,
        introHtml: `
      <p>Hi ${escapeHtml(ctx.parent_name || "Customer")},</p>
      <p>Your cash payment has been confirmed successfully at reception.</p>
      <p>This email serves as your payment receipt.</p>
    `,
        footerHtml:
            "Thank you for your payment. Your booking or enrollment is now confirmed in the system.",
    };
}

async function sendInvoiceEmailByPaymentId(paymentId) {
    const ctx = await getPaymentEmailContext(paymentId);
    const meta = getInvoiceMeta(ctx);

    const rows = buildCommonRows(ctx);
    rows[0][0] = "Invoice No";

    await sendMail({
        to: ctx.parent_email,
        subject: meta.subject,
        html: renderLayout({
            title: "Invoice",
            introHtml: meta.introHtml,
            rows,
            footerHtml: meta.footerHtml,
            notes: ctx.booking_notes || ctx.notes,
        }),
    });
}

async function sendReceiptEmailByPaymentId(paymentId) {
    const ctx = await getPaymentEmailContext(paymentId);
    const meta = getReceiptMeta(ctx);

    const rows = buildCommonRows(ctx);
    rows[0][0] = "Receipt No";
    rows.push(["Confirmed At", formatDateTime(ctx.confirmed_at || new Date())]);

    await sendMail({
        to: ctx.parent_email,
        subject: meta.subject,
        html: renderLayout({
            title: "Payment Receipt",
            introHtml: meta.introHtml,
            rows,
            footerHtml: meta.footerHtml,
            notes: ctx.booking_notes || ctx.notes,
        }),
    });
}

async function sendCardPaymentInvoiceAndReceiptEmailByPaymentId(paymentId) {
    const ctx = await getPaymentEmailContext(paymentId);

    const rows = buildCommonRows(ctx);
    rows.push(["Confirmed At", formatDateTime(ctx.confirmed_at || new Date())]);

    await sendMail({
        to: ctx.parent_email,
        subject: `Invoice and Receipt ${ctx.payment_no} - Card payment successful`,
        html: renderLayout({
            title: "Invoice and Receipt",
            introHtml: `
        <p>Hi ${escapeHtml(ctx.parent_name || "Customer")},</p>
        <p>Your card payment was completed successfully in real time.</p>
        <p>This email contains both your invoice and your payment receipt.</p>
      `,
            rows: [
                ["Invoice No", ctx.payment_no || "-"],
                ["Receipt No", ctx.payment_no || "-"],
                ...rows.slice(1),
            ],
            footerHtml:
                "Thank you for your payment. Your booking or enrollment is now confirmed in the system.",
            notes: ctx.booking_notes || ctx.notes,
        }),
    });
}

module.exports = {
    sendInvoiceEmailByPaymentId,
    sendReceiptEmailByPaymentId,
    sendCardPaymentInvoiceAndReceiptEmailByPaymentId,
};