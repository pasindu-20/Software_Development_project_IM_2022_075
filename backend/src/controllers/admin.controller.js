const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");

function generateTempPassword() {
  return "Tmp@" + crypto.randomBytes(4).toString("hex");
}

async function ensurePlayAreasTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS play_areas (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      age_group VARCHAR(100) NULL,
      image_url TEXT NULL,
      capacity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Add missing columns safely for older tables
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN description TEXT NULL`);
  } catch {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN age_group VARCHAR(100) NULL`);
  } catch {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN image_url TEXT NULL`);
  } catch {}
}

async function ensureClassesTypeColumn() {
  try {
    await db.query(`
      ALTER TABLE classes
      ADD COLUMN item_type ENUM('CLASS','EVENT') NOT NULL DEFAULT 'CLASS'
    `);
  } catch {}
}

exports.createStaff = async (req, res) => {
  try {
    const { full_name, email, phone, role } = req.body;

    if (!full_name || !email || !role) {
      return res.status(400).json({ message: "full_name, email, role are required" });
    }

    if (!["RECEPTIONIST", "INSTRUCTOR"].includes(role)) {
      return res.status(400).json({ message: "role must be RECEPTIONIST or INSTRUCTOR" });
    }

    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exists.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const [roleRows] = await db.query("SELECT id FROM roles WHERE name=?", [role]);
    if (!roleRows.length) {
      return res.status(500).json({ message: `Role ${role} not found in roles table` });
    }

    const role_id = roleRows[0].id;
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role_id, status, force_password_change)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)`,
      [full_name, email, phone || null, password_hash, role_id]
    );

    res.status(201).json({
      message: "Staff account created",
      tempPassword,
    });
  } catch (err) {
    console.error("createStaff error:", err);
    res.status(500).json({ message: "Failed to create staff" });
  }
};

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

exports.dashboardCards = async (req, res) => {
  try {
    const [[inquiries]] = await db.query(
      `SELECT
         COUNT(*) AS totalInquiries,
         SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) AS newInquiries
       FROM customer_inquiries`
    );

    const [[enrollments]] = await db.query(
      `SELECT COUNT(*) AS totalEnrollments FROM enrollments`
    );

    const [[revenue]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS totalRevenue
       FROM payments
       WHERE payment_status = 'PAID'`
    );

    res.json({
      totalInquiries: Number(inquiries?.totalInquiries || 0),
      newInquiries: Number(inquiries?.newInquiries || 0),
      totalEnrollments: Number(enrollments?.totalEnrollments || 0),
      totalRevenue: Number(revenue?.totalRevenue || 0),
    });
  } catch (err) {
    console.error("dashboardCards error:", err);
    res.status(500).json({ message: "Failed to load dashboard cards" });
  }
};

exports.inquiriesByStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM customer_inquiries
       GROUP BY status
       ORDER BY status`
    );

    res.json(rows.map((row) => ({
      ...row,
      count: Number(row.count || 0),
    })));
  } catch (err) {
    console.error("inquiriesByStatus error:", err);
    res.status(500).json({ message: "Failed to load inquiry status chart" });
  }
};

exports.monthlyRevenue = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE payment_status = 'PAID'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    res.json(rows.map((row) => ({
      ...row,
      total: Number(row.total || 0),
    })));
  } catch (err) {
    console.error("monthlyRevenue error:", err);
    res.status(500).json({ message: "Failed to load monthly revenue" });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id,
              p.payment_no,
              COALESCE(u.full_name, 'Unknown') AS payer_name,
              p.amount,
              p.payment_method,
              p.payment_status,
              p.reference_no,
              p.notes,
              p.created_at,
              cl.title AS class_title,
              ch.child_name,
              b.booking_type,
              b.booking_date,
              b.time_slot
       FROM payments p
       LEFT JOIN users u ON u.id = p.parent_user_id
       LEFT JOIN enrollments e ON e.id = p.enrollment_id
       LEFT JOIN classes cl ON cl.id = e.class_id
       LEFT JOIN children ch ON ch.id = e.child_id
       LEFT JOIN bookings b ON b.id = p.booking_id
       ORDER BY p.created_at DESC, p.id DESC`
    );

    res.json(rows.map((row) => ({
      ...row,
      amount: Number(row.amount || 0),
    })));
  } catch (err) {
    console.error("listPayments error:", err);
    res.status(500).json({ message: "Failed to load payments" });
  }
};

exports.listReservations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.id,
              b.booking_type,
              b.booking_date,
              b.time_slot,
              COALESCE(u.full_name, 'Unknown') AS customer_name,
              u.email AS customer_email,
              u.phone AS customer_phone,
              b.notes,
              b.status,
              b.created_at
       FROM bookings b
       LEFT JOIN users u ON u.id = b.parent_user_id
       ORDER BY b.booking_date DESC, b.time_slot DESC, b.id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("listReservations error:", err);
    res.status(500).json({ message: "Failed to load reservations" });
  }
};

exports.listEventsClasses = async (req, res) => {
  try {
    await ensureClassesTypeColumn();

    const [rows] = await db.query(
      `SELECT c.id,
              c.item_type,
              c.title,
              c.description,
              c.age_min,
              c.age_max,
              c.fee,
              c.status,
              c.created_at,
              COALESCE(COUNT(e.id), 0) AS total_enrollments
       FROM classes c
       LEFT JOIN enrollments e ON e.class_id = c.id
       GROUP BY c.id, c.item_type, c.title, c.description, c.age_min, c.age_max, c.fee, c.status, c.created_at
       ORDER BY c.created_at DESC, c.id DESC`
    );

    res.json(
      rows.map((row) => ({
        ...row,
        fee: Number(row.fee || 0),
        total_enrollments: Number(row.total_enrollments || 0),
      }))
    );
  } catch (err) {
    console.error("listEventsClasses error:", err);
    res.status(500).json({ message: "Failed to load classes / events" });
  }
};

exports.createEventClass = async (req, res) => {
  try {
    await ensureClassesTypeColumn();

    const { item_type, title, description, age_min, age_max, fee, status } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    const safeType = ["CLASS", "EVENT"].includes(item_type) ? item_type : "CLASS";

    if (!Number.isFinite(Number(age_min)) || Number(age_min) < 0) {
      return res.status(400).json({ message: "age_min must be 0 or more" });
    }

    if (!Number.isFinite(Number(age_max)) || Number(age_max) < Number(age_min)) {
      return res.status(400).json({
        message: "age_max must be greater than or equal to age_min",
      });
    }

    if (!Number.isFinite(Number(fee)) || Number(fee) < 0) {
      return res.status(400).json({ message: "fee must be 0 or more" });
    }

    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";

    const [result] = await db.query(
      `INSERT INTO classes (item_type, title, description, age_min, age_max, fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        safeType,
        String(title).trim(),
        description ? String(description).trim() : null,
        Number(age_min),
        Number(age_max),
        Number(fee),
        safeStatus,
      ]
    );

    res.status(201).json({
      message: "Class / Event created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("createEventClass error:", err);
    res.status(500).json({ message: "Failed to create class / event" });
  }
};

exports.listPlayAreas = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const [rows] = await db.query(
      `SELECT id, name, description, age_group, image_url, capacity, price, status, created_at
       FROM play_areas
       ORDER BY created_at DESC, id DESC`
    );

    res.json(
      rows.map((row) => ({
        ...row,
        price: Number(row.price || 0),
        capacity: Number(row.capacity || 0),
      }))
    );
  } catch (err) {
    console.error("listPlayAreas error:", err);
    res.status(500).json({ message: "Failed to load play areas" });
  }
};

exports.createPlayArea = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const { name, description, age_group, image_url, capacity, price, status } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!Number.isFinite(Number(capacity)) || Number(capacity) <= 0) {
      return res.status(400).json({ message: "capacity must be a positive number" });
    }

    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ message: "price must be a positive number" });
    }

    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";

    const [result] = await db.query(
      `INSERT INTO play_areas (name, description, age_group, image_url, capacity, price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        description ? String(description).trim() : null,
        age_group ? String(age_group).trim() : null,
        image_url ? String(image_url).trim() : null,
        Number(capacity),
        Number(price),
        safeStatus,
      ]
    );

    res.status(201).json({
      message: "Play area created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("createPlayArea error:", err);
    res.status(500).json({ message: "Failed to create play area" });
  }
};