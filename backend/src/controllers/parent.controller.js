const db = require("../config/db");

async function ensureClassesTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(100) NOT NULL,
      description TEXT NULL,
      image_url TEXT NULL,
      age_min INT NULL,
      age_max INT NULL,
      schedule_text VARCHAR(200) NULL,
      fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      item_type ENUM('CLASS','EVENT') NOT NULL DEFAULT 'CLASS',
      instructor_id INT NULL,
      event_date DATE NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN description TEXT NULL AFTER title`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN image_url TEXT NULL AFTER description`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN age_min INT NULL AFTER image_url`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN age_max INT NULL AFTER age_min`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN item_type ENUM('CLASS','EVENT') NOT NULL DEFAULT 'CLASS' AFTER fee`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN instructor_id INT NULL AFTER item_type`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN event_date DATE NULL AFTER instructor_id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN start_time TIME NULL AFTER event_date`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN end_time TIME NULL AFTER start_time`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE classes ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  } catch (err) {}
}

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone FROM users WHERE id=?",
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ message: "Failed to load profile" });
  }
};

exports.listClasses = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const [rows] = await db.query(`
      SELECT id, title, description, image_url, age_min, age_max, fee, instructor_id, event_date, start_time, end_time
      FROM classes
      WHERE status='ACTIVE' AND item_type='CLASS'
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (e) {
    console.error("parent listClasses error:", e);
    res.status(500).json({ message: "Failed to load classes" });
  }
};

exports.addChild = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { child_name, dob, notes } = req.body;

    if (!child_name) {
      return res.status(400).json({ message: "child_name is required" });
    }

    await db.query(
      "INSERT INTO children (parent_id, full_name, date_of_birth, medical_notes) VALUES (?, ?, ?, ?)",
      [parentId, child_name, dob || null, notes || null]
    );

    res.status(201).json({ message: "Child added" });
  } catch (e) {
    console.error("addChild error:", e);
    res.status(500).json({ message: "Failed to add child" });
  }
};

exports.listChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, full_name, date_of_birth, medical_notes, created_at
       FROM children
       WHERE parent_id=?
       ORDER BY created_at DESC`,
      [parentId]
    );
    res.json(rows);
  } catch (e) {
    console.error("listChildren error:", e);
    res.status(500).json({ message: "Failed to load children" });
  }
};

exports.enroll = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { child_id, class_id } = req.body;

    if (!child_id || !class_id) {
      return res.status(400).json({ message: "child_id and class_id are required" });
    }

    const [kids] = await db.query(
      "SELECT id FROM children WHERE id=? AND parent_id=?",
      [child_id, parentId]
    );

    if (!kids.length) {
      return res.status(403).json({ message: "Invalid child" });
    }

    await db.query(
      "INSERT INTO enrollments (child_id, class_id, status) VALUES (?, ?, 'PENDING')",
      [child_id, class_id]
    );

    res.status(201).json({ message: "Enrollment created (PENDING)" });
  } catch (e) {
    console.error("enroll error:", e);
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Child already enrolled in this class" });
    }
    res.status(500).json({ message: "Failed to enroll" });
  }
};

exports.myEnrollments = async (req, res) => {
  try {
    const parentId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT e.id,
             c.full_name AS child_name,
             cl.title AS class_title,
             e.status,
             e.enrolled_at
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN classes cl ON cl.id = e.class_id
      WHERE c.parent_id=?
      ORDER BY e.enrolled_at DESC
    `,
      [parentId]
    );

    res.json(rows);
  } catch (e) {
    console.error("myEnrollments error:", e);
    res.status(500).json({ message: "Failed to load enrollments" });
  }
};

exports.myPayments = async (req, res) => {
  try {
    const parentId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT p.id,
             p.amount,
             p.payment_method,
             p.payment_status,
             p.transaction_ref,
             p.paid_at,
             cl.title AS class_title,
             ch.full_name AS child_name
      FROM payments p
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN classes cl ON cl.id = e.class_id
      LEFT JOIN children ch ON ch.id = e.child_id
      WHERE ch.parent_id=?
      ORDER BY p.paid_at DESC, p.id DESC
    `,
      [parentId]
    );

    res.json(rows);
  } catch (e) {
    console.error("myPayments error:", e);
    res.status(500).json({ message: "Failed to load payments" });
  }
};