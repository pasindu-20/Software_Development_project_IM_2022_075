// backend/src/auth.controller.js
const bcrypt = require("bcrypt");
const db = require("../config/db");
const authService = require("../services/auth.service");
const { sendMail } = require("../utils/mailer");

// Public signup forced role (PARENT). Ensure your DB role_id matches.
const DEFAULT_PUBLIC_ROLE_ID = 4;

/* ---------------- helpers ---------------- */
function minutesFromNow(min) {
  return new Date(Date.now() + min * 60 * 1000);
}

function generateOTP() {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ---------------- REGISTER (Public) ---------------- */
exports.register = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role_id, status, force_password_change)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0)`,
      [full_name, email, phone, hashedPassword, DEFAULT_PUBLIC_ROLE_ID]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ---------------- LOGIN ---------------- */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.status='ACTIVE'`,
      [email]
    );

    if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = authService.generateToken({
      id: user.id,
      role: user.role_name, // IMPORTANT: string roles for frontend RBAC
      email: user.email,
      full_name: user.full_name,
    });

    res.json({
      token,
      role: user.role_name,
      force_password_change: !!user.force_password_change,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ---------------- CHANGE PASSWORD (JWT required) ---------------- */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const [rows] = await db.query("SELECT password_hash FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);

    await db.query(
      "UPDATE users SET password_hash=?, force_password_change=0 WHERE id=?",
      [hashed, userId]
    );

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("❌ Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};

/* ---------------- FORGOT PASSWORD (Public)
   Sends OTP + a clickable reset link that pre-fills email.
----------------------------------------------------------- */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Generic response for security (avoid user enumeration)
    const [users] = await db.query(
      "SELECT id, full_name FROM users WHERE email=? AND status='ACTIVE'",
      [email]
    );
    if (users.length === 0) {
      return res.json({ message: "If the email exists, OTP has been sent." });
    }

    const user = users[0];

    // cleanup expired OTP rows
    await db.query(
      "DELETE FROM password_resets WHERE user_id=? AND used_at IS NULL AND expires_at < NOW()",
      [user.id]
    );

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const minutes = Number(process.env.OTP_EXPIRE_MINUTES || 10);
    const expiresAt = minutesFromNow(minutes);

    await db.query(
      `INSERT INTO password_resets (user_id, otp_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, otpHash, expiresAt]
    );

    // ✅ IMPORTANT: HashRouter link -> /#/auth/reset-password
    const app = process.env.APP_NAME || "Poddo Playhouse";
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontend}/#/auth/reset-password?email=${encodeURIComponent(email)}`;

    try {
      await sendMail({
        to: email,
        subject: `${app} - Password Reset`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
            <h2>${app} Password Reset</h2>

            <p>We received a request to reset your password.</p>

            <p style="margin-top:20px;"><b>Your OTP:</b></p>
            <div style="
              font-size:32px;
              font-weight:800;
              letter-spacing:4px;
              margin:10px 0;
              padding:10px 16px;
              background:#f3f4f6;
              display:inline-block;
              border-radius:8px;
            ">
              ${otp}
            </div>

            <p>This OTP expires in <b>${minutes} minutes</b>.</p>

            <hr style="margin:24px 0"/>

            <p><b>Reset your password:</b></p>

            <a href="${resetLink}"
               target="_blank"
               style="
                 display:inline-block;
                 background:#2563eb;
                 color:#ffffff;
                 padding:12px 20px;
                 border-radius:8px;
                 text-decoration:none;
                 font-weight:700;
                 margin-top:10px;
               ">
              Open Reset Password Page
            </a>

            <p style="margin-top:20px;font-size:13px;color:#555">
              If the button does not work, copy and paste this link into your browser:
            </p>

            <p style="font-size:12px;word-break:break-all;color:#111">
              ${resetLink}
            </p>

            <p style="margin-top:20px;color:#666;font-size:12px">
              If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      });

      console.log("✅ OTP email sent to:", email);
    } catch (mailErr) {
      console.error("❌ OTP email failed:", mailErr);
      return res.status(500).json({
        message: "Email sending failed",
        error: mailErr.message,
      });
    }

    return res.json({ message: "If the email exists, OTP has been sent." });
  } catch (err) {
    console.error("❌ forgotPassword error:", err);
    res.status(500).json({ message: "Failed to process forgot password", error: err.message });
  }
};

/* ---------------- RESET PASSWORD (Public)
   Requires email + OTP + new_password
---------------------------------------------------------- */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const [users] = await db.query(
      "SELECT id FROM users WHERE email=? AND status='ACTIVE'",
      [email]
    );
    if (users.length === 0) return res.status(400).json({ message: "Invalid OTP or expired" });

    const userId = users[0].id;

    const [resets] = await db.query(
      `SELECT * FROM password_resets
       WHERE user_id=? AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    if (resets.length === 0) return res.status(400).json({ message: "Invalid OTP or expired" });

    const row = resets[0];

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (row.attempts >= 5) {
      return res.status(429).json({ message: "Too many attempts. Request a new OTP." });
    }

    const ok = await bcrypt.compare(String(otp), row.otp_hash);
    if (!ok) {
      await db.query("UPDATE password_resets SET attempts = attempts + 1 WHERE id=?", [row.id]);
      return res.status(400).json({ message: "Invalid OTP or expired" });
    }

    const hashed = await bcrypt.hash(new_password, 10);

    await db.query("START TRANSACTION");

    await db.query(
      "UPDATE users SET password_hash=?, force_password_change=0 WHERE id=?",
      [hashed, userId]
    );

    await db.query("UPDATE password_resets SET used_at=NOW() WHERE id=?", [row.id]);

    await db.query("COMMIT");

    res.json({ message: "Password reset successful" });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch {}
    console.error("❌ resetPassword error:", err);
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
};
