const bcrypt = require("bcrypt");
const db = require("../config/db");
const { audit } = require("../utils/audit");

// Allowed staff roles
const STAFF_ROLE_IDS = [2, 3]; // 2=RECEPTIONIST, 3=INSTRUCTOR

exports.createStaffUser = async (req, res) => {
  try {
    const { full_name, email, phone = null, password, role_id } = req.body;

    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({
        message: "full_name, email, password, role_id are required",
      });
    }

    const roleIdNum = Number(role_id);
    if (!STAFF_ROLE_IDS.includes(roleIdNum)) {
      return res.status(400).json({
        message: "role_id must be 2 (RECEPTIONIST) or 3 (INSTRUCTOR)",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Prevent duplicate email
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.query(
  `INSERT INTO users (full_name, email, phone, password_hash, role_id, status, force_password_change)
   VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)`,
  [full_name, email, phone, hashed, roleIdNum]
);


    await audit({
      user_id: req.user.id,
      action: "STAFF_USER_CREATED",
      table_name: "users",
      record_id: result.insertId,
      ip_address: req.ip,
    });

    return res.status(201).json({
      message: "Staff user created",
      user_id: result.insertId,
    });
  } catch (err) {
    console.error("createStaffUser error:", err);
    return res.status(500).json({ message: "Failed to create staff user" });
  }
};

exports.listStaffUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role_id, status, created_at
       FROM users
       WHERE role_id IN (2,3)
       ORDER BY created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("listStaffUsers error:", err);
    return res.status(500).json({ message: "Failed to fetch staff users" });
  }
};
