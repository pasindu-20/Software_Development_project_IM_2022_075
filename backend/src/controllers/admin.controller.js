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

  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN description TEXT NULL`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN age_group VARCHAR(100) NULL`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN image_url TEXT NULL`);
  } catch (err) {}
}

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
    const [rows] = await db.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.force_password_change,
             r.name AS role, u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name IN ('RECEPTIONIST','INSTRUCTOR')
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("listStaff error:", err);
    res.status(500).json({ message: "Failed to load staff list" });
  }
};

exports.dashboardCards = async (req, res) => {
  try {
    const [[inquiries]] = await db.query(`
      SELECT
        COUNT(*) AS totalInquiries,
        SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) AS newInquiries
      FROM customer_inquiries
    `);

    const [[enrollments]] = await db.query(`
      SELECT COUNT(*) AS totalEnrollments FROM enrollments
    `);

    const [[revenue]] = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalRevenue
      FROM payments
      WHERE payment_status IN ('SUCCESS', 'PAID')
    `);

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
    const [rows] = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM customer_inquiries
      GROUP BY status
      ORDER BY status
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        count: Number(row.count || 0),
      }))
    );
  } catch (err) {
    console.error("inquiriesByStatus error:", err);
    res.status(500).json({ message: "Failed to load inquiry status chart" });
  }
};

exports.monthlyRevenue = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE payment_status IN ('SUCCESS', 'PAID')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        total: Number(row.total || 0),
      }))
    );
  } catch (err) {
    console.error("monthlyRevenue error:", err);
    res.status(500).json({ message: "Failed to load monthly revenue" });
  }
};

exports.listInstructors = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.full_name, u.email
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'INSTRUCTOR' AND u.status = 'ACTIVE'
      ORDER BY u.full_name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listInstructors error:", err);
    res.status(500).json({ message: "Failed to load instructors" });
  }
};

exports.listEventsClasses = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const [rows] = await db.query(`
      SELECT c.id,
             c.item_type,
             c.title,
             c.description,
             c.image_url,
             c.age_min,
             c.age_max,
             c.fee,
             c.instructor_id,
             u.full_name AS instructor_name,
             c.event_date,
             c.start_time,
             c.end_time,
             c.status,
             c.created_at,
             c.updated_at
      FROM classes c
      LEFT JOIN users u ON u.id = c.instructor_id
      ORDER BY c.created_at DESC, c.id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        fee: Number(row.fee || 0),
      }))
    );
  } catch (err) {
    console.error("listEventsClasses error:", err);
    res.status(500).json({ message: "Failed to load classes / events" });
  }
};

exports.createEventClass = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const {
      item_type,
      title,
      description,
      image_url,
      age_min,
      age_max,
      fee,
      instructor_id,
      event_date,
      start_time,
      end_time,
      status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!instructor_id) {
      return res.status(400).json({ message: "instructor_id is required" });
    }

    if (!event_date) {
      return res.status(400).json({ message: "event_date is required" });
    }

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    if (!end_time) {
      return res.status(400).json({ message: "end_time is required" });
    }

    const safeType = ["CLASS", "EVENT"].includes(item_type) ? item_type : "CLASS";
    const safeFee = Number(fee || 0);
    const safeAgeMin = age_min === "" || age_min == null ? null : Number(age_min);
    const safeAgeMax = age_max === "" || age_max == null ? null : Number(age_max);
    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeImageUrl = image_url && String(image_url).trim() ? String(image_url).trim() : null;
    const safeInstructorId = Number(instructor_id);

    if (!Number.isInteger(safeInstructorId) || safeInstructorId <= 0) {
      return res.status(400).json({ message: "instructor_id must be valid" });
    }

    if (safeAgeMin != null && !Number.isFinite(safeAgeMin)) {
      return res.status(400).json({ message: "age_min must be a valid number" });
    }

    if (safeAgeMax != null && !Number.isFinite(safeAgeMax)) {
      return res.status(400).json({ message: "age_max must be a valid number" });
    }

    if (safeAgeMin != null && safeAgeMin < 0) {
      return res.status(400).json({ message: "age_min must be 0 or more" });
    }

    if (safeAgeMax != null && safeAgeMax < 0) {
      return res.status(400).json({ message: "age_max must be 0 or more" });
    }

    if (safeAgeMin != null && safeAgeMax != null && safeAgeMax < safeAgeMin) {
      return res.status(400).json({ message: "age_max must be greater than or equal to age_min" });
    }

    if (!Number.isFinite(safeFee) || safeFee < 0) {
      return res.status(400).json({ message: "fee must be 0 or more" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: "end_time must be greater than start_time" });
    }

    const [instructorRows] = await db.query(`
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'INSTRUCTOR'
      LIMIT 1
    `, [safeInstructorId]);

    if (!instructorRows.length) {
      return res.status(400).json({ message: "Selected instructor is invalid" });
    }

    const [result] = await db.query(
      `INSERT INTO classes (
        item_type, title, description, image_url, age_min, age_max, fee,
        instructor_id, event_date, start_time, end_time, status
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeType,
        String(title).trim(),
        description ? String(description).trim() : null,
        safeImageUrl,
        safeAgeMin,
        safeAgeMax,
        safeFee,
        safeInstructorId,
        event_date,
        start_time,
        end_time,
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

exports.updateEventClass = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    const {
      item_type,
      title,
      description,
      image_url,
      age_min,
      age_max,
      fee,
      instructor_id,
      event_date,
      start_time,
      end_time,
      status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!instructor_id) {
      return res.status(400).json({ message: "instructor_id is required" });
    }

    if (!event_date) {
      return res.status(400).json({ message: "event_date is required" });
    }

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    if (!end_time) {
      return res.status(400).json({ message: "end_time is required" });
    }

    const safeType = ["CLASS", "EVENT"].includes(item_type) ? item_type : "CLASS";
    const safeFee = Number(fee || 0);
    const safeAgeMin = age_min === "" || age_min == null ? null : Number(age_min);
    const safeAgeMax = age_max === "" || age_max == null ? null : Number(age_max);
    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeImageUrl = image_url && String(image_url).trim() ? String(image_url).trim() : null;
    const safeInstructorId = Number(instructor_id);

    if (!Number.isInteger(safeInstructorId) || safeInstructorId <= 0) {
      return res.status(400).json({ message: "instructor_id must be valid" });
    }

    if (safeAgeMin != null && !Number.isFinite(safeAgeMin)) {
      return res.status(400).json({ message: "age_min must be a valid number" });
    }

    if (safeAgeMax != null && !Number.isFinite(safeAgeMax)) {
      return res.status(400).json({ message: "age_max must be a valid number" });
    }

    if (safeAgeMin != null && safeAgeMin < 0) {
      return res.status(400).json({ message: "age_min must be 0 or more" });
    }

    if (safeAgeMax != null && safeAgeMax < 0) {
      return res.status(400).json({ message: "age_max must be 0 or more" });
    }

    if (safeAgeMin != null && safeAgeMax != null && safeAgeMax < safeAgeMin) {
      return res.status(400).json({ message: "age_max must be greater than or equal to age_min" });
    }

    if (!Number.isFinite(safeFee) || safeFee < 0) {
      return res.status(400).json({ message: "fee must be 0 or more" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: "end_time must be greater than start_time" });
    }

    const [instructorRows] = await db.query(`
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'INSTRUCTOR'
      LIMIT 1
    `, [safeInstructorId]);

    if (!instructorRows.length) {
      return res.status(400).json({ message: "Selected instructor is invalid" });
    }

    const [result] = await db.query(
      `UPDATE classes
       SET item_type = ?,
           title = ?,
           description = ?,
           image_url = ?,
           age_min = ?,
           age_max = ?,
           fee = ?,
           instructor_id = ?,
           event_date = ?,
           start_time = ?,
           end_time = ?,
           status = ?
       WHERE id = ?`,
      [
        safeType,
        String(title).trim(),
        description ? String(description).trim() : null,
        safeImageUrl,
        safeAgeMin,
        safeAgeMax,
        safeFee,
        safeInstructorId,
        event_date,
        start_time,
        end_time,
        safeStatus,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Class / Event not found" });
    }

    res.json({ message: "Class / Event updated successfully" });
  } catch (err) {
    console.error("updateEventClass error:", err);
    res.status(500).json({ message: "Failed to update class / event" });
  }
};

exports.updateEventClassStatus = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "status must be ACTIVE or INACTIVE" });
    }

    const [result] = await db.query(
      `UPDATE classes SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Class / Event not found" });
    }

    res.json({ message: `Class / Event marked as ${status}` });
  } catch (err) {
    console.error("updateEventClassStatus error:", err);
    res.status(500).json({ message: "Failed to update class / event status" });
  }
};

exports.deleteEventClass = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    const [result] = await db.query(
      `DELETE FROM classes WHERE id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Class / Event not found" });
    }

    res.json({ message: "Class / Event deleted successfully" });
  } catch (err) {
    console.error("deleteEventClass error:", err);
    res.status(500).json({ message: "Failed to delete class / event" });
  }
};

exports.listPlayAreas = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const [rows] = await db.query(`
      SELECT id, name, description, age_group, image_url, capacity, price, status, created_at
      FROM play_areas
      ORDER BY created_at DESC, id DESC
    `);

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

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "price must be 0 or more" });
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