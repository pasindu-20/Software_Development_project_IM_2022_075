const { sendMail } = require("../utils/mailer");

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

function getBaseEmailShell({ headerLabel, title, contentHtml }) {
  return `
    <div style="margin:0; padding:0; background:#f4f7fb; font-family:Inter, Arial, Helvetica, sans-serif; color:#0f172a;">
      <div style="max-width:640px; margin:0 auto; padding:32px 16px;">
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          
          <div style="height:6px; background:linear-gradient(90deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%);"></div>

          <div style="padding:28px 28px 8px;">
            <div style="display:inline-block; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#be185d; background:#fdf2f8; border:1px solid #fbcfe8; padding:8px 12px; border-radius:999px;">
              ${escapeHtml(headerLabel)}
            </div>

            <h1 style="margin:18px 0 0; font-size:14px; line-height:1.25; font-weight:400; color:#0f172a;">
              ${escapeHtml(title)}
            </h1>
          </div>

          <div style="padding:10px 28px 30px;">
            ${contentHtml}
          </div>
        </div>

        <div style="padding:16px 8px 0; text-align:center; font-size:12px; line-height:1.6; color:#64748b;">
          Poddo Play House
        </div>
      </div>
    </div>
  `;
}

async function sendInquiryAcknowledgementEmail({
  customerName,
  email,
}) {
  if (!email) return;

  const appName = process.env.APP_NAME || "Poddo Play House";
  const safeCustomerName = customerName || "Customer";

  await sendMail({
    to: email,
    subject: `Thank you for contacting ${appName}`,
    text: [
      `Hi ${safeCustomerName},`,
      "",
      `Thank you for contacting ${appName}.`,
      "We have received your message successfully.",
      "Our team will contact you soon.",
      "",
      `Regards,`,
      `${appName} Team`,
    ].join("\n"),
    html: getBaseEmailShell({
      headerLabel: "Message Received",
      title: "Thank you for contacting us",
      contentHtml: `
        <p style="margin:0 0 16px; font-size:16px; line-height:1.8; color:#334155;">
          Hi ${escapeHtml(safeCustomerName)},
        </p>

        <p style="margin:0 0 16px; font-size:16px; line-height:1.8; color:#334155;">
          Thank you for contacting <strong style="color:#0f172a;">${escapeHtml(appName)}</strong>.
        </p>

        <p style="margin:0; font-size:16px; line-height:1.8; color:#334155;">
          We have received your message successfully, and our team will contact you soon.
        </p>

        <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e2e8f0; font-size:15px; line-height:1.8; color:#475569;">
          Regards,<br />
          ${escapeHtml(appName)} Team
        </div>
      `,
    }),
  });
}

async function sendInquiryReplyEmail({
  customerName,
  email,
  subject,
  replyMessage,
  staffName,
}) {
  if (!email) return;

  const appName = process.env.APP_NAME || "Poddo Play House";
  const safeCustomerName = customerName || "Customer";
  const safeStaffName = staffName || `${appName} Team`;
  const safeSubject = subject || "Inquiry Response";

  await sendMail({
    to: email,
    subject: safeSubject,
    text: [
      `Hi ${safeCustomerName},`,
      "",
      replyMessage || "-",
      "",
      `Regards,`,
      safeStaffName,
      `${appName}`,
    ].join("\n"),
    html: getBaseEmailShell({
      headerLabel: "Customer Support",
      title: "Response to your inquiry",
      contentHtml: `
        <p style="margin:0 0 18px; font-size:16px; line-height:1.8; color:#334155;">
          Hi ${escapeHtml(safeCustomerName)},
        </p>

        <div style="font-size:16px; line-height:1.85; color:#334155;">
          ${nl2br(replyMessage || "-")}
        </div>

        <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e2e8f0; font-size:15px; line-height:1.8; color:#475569;">
          Regards,<br />
          ${escapeHtml(safeStaffName)}<br />
          ${escapeHtml(appName)}
        </div>
      `,
    }),
  });
}

module.exports = {
  sendInquiryAcknowledgementEmail,
  sendInquiryReplyEmail,
};