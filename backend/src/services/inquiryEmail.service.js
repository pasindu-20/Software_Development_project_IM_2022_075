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

async function sendInquiryAcknowledgementEmail({
  customerName,
  email,
  phone,
  inquiryType,
  message,
}) {
  if (!email) return;

  const appName = process.env.APP_NAME || "Poddo Play House";

  await sendMail({
    to: email,
    subject: `Thank you for contacting ${appName}`,
    text: [
      `Hi ${customerName || "Customer"},`,
      "",
      `Thank you for contacting ${appName}.`,
      "We have received your message successfully.",
      "Our team will respond to you soon.",
      "",
      "Your inquiry details:",
      `Name: ${customerName || "-"}`,
      `Email: ${email || "-"}`,
      `Phone: ${phone || "-"}`,
      `Inquiry Type: ${inquiryType || "-"}`,
      `Message: ${message || "-"}`,
      "",
      `Regards,`,
      `${appName} Team`,
    ].join("\n"),
    html: `
      <div style="background:#f4f6f8; padding:24px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
        <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          
          <div style="background:linear-gradient(135deg, #f693e0 0%, #f4c2f2 100%); color:#ffffff; padding:26px 28px;">
            <img
              src="https://res.cloudinary.com/du6mnjqdn/image/upload/v1775075925/images_qw2txg.png"
              alt="Logo"
              style="height:48px; margin-bottom:10px;"
            />
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; opacity:0.9;">
              ${escapeHtml(appName)}
            </div>
            <div style="font-size:13px; opacity:0.92; margin-top:4px;">
              Contact Request Received
            </div>
          </div>

          <div style="padding:24px;">
            <p>Hi ${escapeHtml(customerName || "Customer")},</p>

            <p>Thank you for contacting <strong>${escapeHtml(appName)}</strong>.</p>

            <p>We have received your message successfully. Our team will respond to you soon.</p>

            <div style="margin-top:16px; padding:14px 16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
              <div style="font-weight:700; margin-bottom:10px;">Your Inquiry Details</div>

              <table style="width:100%; border-collapse:collapse;">
                <tbody>
                  <tr>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; width:34%; font-weight:700;">Name</td>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb;">${escapeHtml(customerName || "-")}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; font-weight:700;">Email</td>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb;">${escapeHtml(email || "-")}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; font-weight:700;">Phone</td>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb;">${escapeHtml(phone || "-")}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; font-weight:700;">Inquiry Type</td>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb;">${escapeHtml(inquiryType || "-")}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb; background:#f8fafc; font-weight:700;">Message</td>
                    <td style="padding:10px 12px; border:1px solid #e5e7eb;">${nl2br(message || "-")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="margin-top:18px; font-size:14px; line-height:1.7; color:#4b5563;">
              Thank you for reaching out to us. We appreciate your interest and will get back to you as soon as possible.
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

async function sendInquiryReplyEmail({
  customerName,
  email,
  subject,
  replyMessage,
  staffName,
  originalMessage,
}) {
  if (!email) return;

  const appName = process.env.APP_NAME || "Poddo Play House";
  const safeCustomerName = customerName || "Customer";
  const safeStaffName = staffName || `${appName} Team`;

  await sendMail({
    to: email,
    subject,
    text: [
      `Hi ${safeCustomerName},`,
      "",
      `Thank you for contacting ${appName}.`,
      "Please find our response below:",
      "",
      replyMessage || "-",
      "",
      originalMessage ? "Your original inquiry:" : null,
      originalMessage || null,
      "",
      `Regards,`,
      safeStaffName,
      `${appName}`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="background:#f4f6f8; padding:24px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
        <div style="max-width:760px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
          <div style="background:linear-gradient(135deg, #f693e0 0%, #f4c2f2 100%); color:#ffffff; padding:26px 28px;">
            <img
              src="https://res.cloudinary.com/du6mnjqdn/image/upload/v1775075925/images_qw2txg.png"
              alt="Logo"
              style="height:48px; margin-bottom:10px;"
            />
            <div style="font-size:12px; letter-spacing:1.2px; text-transform:uppercase; opacity:0.9;">
              ${escapeHtml(appName)}
            </div>
            <div style="font-size:13px; opacity:0.92; margin-top:4px;">
              Inquiry Response
            </div>
          </div>

          <div style="padding:24px;">
            <p>Hi ${escapeHtml(safeCustomerName)},</p>

            <p>Thank you for contacting <strong>${escapeHtml(appName)}</strong>.</p>
            <p>Please find our response below:</p>

            <div style="margin-top:16px; padding:16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;">
              <div style="font-weight:700; margin-bottom:10px;">Our Reply</div>
              <div style="white-space:normal; line-height:1.7;">${nl2br(replyMessage || "-")}</div>
            </div>

            ${
              originalMessage
                ? `
                  <div style="margin-top:16px; padding:16px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                    <div style="font-weight:700; margin-bottom:10px;">Your Original Inquiry</div>
                    <div style="white-space:normal; line-height:1.7; color:#4b5563;">${nl2br(originalMessage)}</div>
                  </div>
                `
                : ""
            }

            <div style="margin-top:18px; font-size:14px; line-height:1.7; color:#4b5563;">
              Regards,<br />
              ${escapeHtml(safeStaffName)}<br />
              ${escapeHtml(appName)}
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendInquiryAcknowledgementEmail,
  sendInquiryReplyEmail,
};