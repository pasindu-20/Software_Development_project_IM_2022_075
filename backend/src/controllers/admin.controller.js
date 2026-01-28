const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");

// helper: create temp password
function generateTempPassword() {
  // Strong temp password
  return "Tmp@" + crypto.randomBytes(4).toString("hex"); // e.g. Tmp@a1b2c3d4
}

// POST /api/admin/staff  (ADMIN only)
exports.createStaff = async (req, res) => {
  try {
    const { full_name, email, phone, role } = req.body;

    if (!full_name || !email || !role) {
      return res.status(400).json({ message: "full_name, email, role are required" });
    }

    if (!["RECEPTIONIST", "INSTRUCTOR"].includes(role)) {
      return res.status(400).json({ message: "role must be RECEPTIONIST or INSTRUCTOR" });
    }

    // check email exists
    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ message: "Email already exists" });

    // find role_id by roles table
    const [roleRows] = await db.query("SELECT id FROM roles WHERE name=?", [role]);
    if (!roleRows.length) return res.status(500).json({ message: `Role ${role} not found in roles table` });

    const role_id = roleRows[0].id;

    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role_id, status, force_password_change)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)`,
      [full_name, email, phone || null, password_hash, role_id]
    );

    // return temp password to admin (in real business: email this to staff)
    res.status(201).json({
      message: "Staff account created",
      tempPassword,
    });
  } catch (err) {
    console.error("createStaff error:", err);
    res.status(500).json({ message: "Failed to create staff" });
  }
};

// GET /api/admin/staff  (ADMIN only)
exports.listStaff = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.force_password_change,
              r.name AS role, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE r.name IN ('RECEPTIONIST','INSTRUCTOR')
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("listStaff error:", err);
    res.status(500).json({ message: "Failed to load staff list" });
  }
};
