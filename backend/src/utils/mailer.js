const nodemailer = require("nodemailer");

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);

  // If SMTP_SECURE is set, use it. Otherwise secure when port is 465.
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

  // Trim credentials to avoid accidental whitespace from .env
  const user = process.env.SMTP_USER && String(process.env.SMTP_USER).trim();
  const pass = process.env.SMTP_PASS && String(process.env.SMTP_PASS).trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Timeouts to avoid hanging
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = createTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    // Verify connection/config early so errors are clearer
    await transporter.verify();
  } catch (err) {
    if (err && err.code === "EAUTH") {
      const hint =
        '\nSMTP authentication failed (EAUTH). If you are using Gmail, ensure you\n' +
        '1) have enabled 2-Step Verification for the account and\n' +
        "2) created an App Password and set it in `SMTP_PASS`.\n" +
        'See https://support.google.com/mail/?p=BadCredentials and\n' +
        'https://support.google.com/accounts/answer/185833 for details.';

      // Attach hint to error message for easier debugging
      err.message = `${err.message}${hint}`;
    }
    throw err;
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
