const db = require("../config/db");

/* ----------------------------- TABLE HELPERS ----------------------------- */

async function ensureBookingsTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      walk_in_customer_name VARCHAR(150) NULL,
      walk_in_phone VARCHAR(50) NULL,
      booking_type ENUM('PLAY_AREA','PARTY','EVENT','CLASS') NOT NULL DEFAULT 'PLAY_AREA',
      booking_date DATE NOT NULL,
      time_slot VARCHAR(50) NULL,
      status ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
      notes VARCHAR(255) NULL,
      created_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN user_id INT NULL AFTER id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN walk_in_customer_name VARCHAR(150) NULL AFTER user_id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN walk_in_phone VARCHAR(50) NULL AFTER walk_in_customer_name`);
  } catch (err) {}

  try {
    await db.query(`
      ALTER TABLE bookings
      MODIFY COLUMN booking_type ENUM('PLAY_AREA','PARTY','EVENT','CLASS') NOT NULL DEFAULT 'PLAY_AREA'
    `);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN booking_type ENUM('PLAY_AREA','PARTY','EVENT','CLASS') NOT NULL DEFAULT 'PLAY_AREA' AFTER walk_in_phone`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN booking_date DATE NOT NULL AFTER booking_type`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN time_slot VARCHAR(50) NULL AFTER booking_date`);
  } catch (err) {}

  try {
    await db.query(`
      ALTER TABLE bookings
      MODIFY COLUMN status ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING'
    `);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN status ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING' AFTER time_slot`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN notes VARCHAR(255) NULL AFTER status`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN created_by INT NULL AFTER notes`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE bookings ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {}
}

async function ensureChildrenTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS children (
      id INT PRIMARY KEY AUTO_INCREMENT,
      parent_user_id INT NOT NULL,
      parent_id INT NULL,
      full_name VARCHAR(150) NOT NULL,
      child_name VARCHAR(150) NULL,
      date_of_birth DATE NULL,
      medical_notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE children ADD COLUMN parent_user_id INT NOT NULL AFTER id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN parent_id INT NULL AFTER parent_user_id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN full_name VARCHAR(150) NOT NULL AFTER parent_id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN child_name VARCHAR(150) NULL AFTER full_name`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN date_of_birth DATE NULL AFTER child_name`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN medical_notes TEXT NULL AFTER date_of_birth`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE children ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
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
    await db.query(`ALTER TABLE classes ADD COLUMN schedule_text VARCHAR(200) NULL AFTER age_max`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE classes ADD COLUMN fee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER schedule_text`);
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

async function ensureEnrollmentsTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      child_id INT NOT NULL,
      class_id INT NOT NULL,
      status ENUM('PENDING','ACTIVE','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_child_class (child_id, class_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE enrollments ADD COLUMN child_id INT NOT NULL AFTER id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE enrollments ADD COLUMN class_id INT NOT NULL AFTER child_id`);
  } catch (err) {}

  try {
    await db.query(`
      ALTER TABLE enrollments
      MODIFY COLUMN status ENUM('PENDING','ACTIVE','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING'
    `);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE enrollments ADD COLUMN status ENUM('PENDING','ACTIVE','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING' AFTER class_id`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE enrollments ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE enrollments ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE enrollments ADD UNIQUE KEY uniq_child_class (child_id, class_id)`);
  } catch (err) {}
}

async function ensurePaymentsTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      payment_no VARCHAR(50) NULL,
      parent_user_id INT NOT NULL,
      enrollment_id INT NULL,
      booking_id INT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_method ENUM('CARD','CASH','BANK_TRANSFER') NOT NULL,
      payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
      reference_no VARCHAR(100) NULL,
      notes TEXT NULL,
      confirmed_by INT NULL,
      confirmed_at DATETIME NULL,
      bank_slip_name VARCHAR(255) NULL,
      bank_slip_data LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE payments ADD COLUMN payment_no VARCHAR(50) NULL AFTER id`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN parent_user_id INT NOT NULL AFTER payment_no`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN enrollment_id INT NULL AFTER parent_user_id`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN booking_id INT NULL AFTER enrollment_id`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER booking_id`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN payment_method ENUM('CARD','CASH','BANK_TRANSFER') NOT NULL AFTER amount`);
  } catch (err) {}
  try {
    await db.query(`
      ALTER TABLE payments
      MODIFY COLUMN payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED')
      NOT NULL DEFAULT 'PENDING'
    `);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING' AFTER payment_method`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN reference_no VARCHAR(100) NULL AFTER payment_status`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN notes TEXT NULL AFTER reference_no`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN confirmed_by INT NULL AFTER notes`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN bank_slip_name VARCHAR(255) NULL AFTER confirmed_at`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN bank_slip_data LONGTEXT NULL AFTER bank_slip_name`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  } catch (err) {}
}

/* ------------------------------- PROFILE ------------------------------- */

// GET /api/parent/me
exports.me = async (req, res) => {
  try {
    await ensureChildrenTableShape();

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const [childrenRows] = await db.query(
      `SELECT
         id,
         COALESCE(NULLIF(child_name, ''), full_name) AS child_name
       FROM children
       WHERE parent_user_id = ? OR parent_id = ?
       ORDER BY created_at DESC, id DESC`,
      [userId, userId]
    );

    return res.json({
      ...rows[0],
      children: childrenRows,
    });
  } catch (err) {
    console.error("parent me error:", err);
    return res.status(500).json({ message: "Failed to load profile", error: err.message });
  }
};

/* ------------------------------- CLASSES ------------------------------- */

// GET /api/parent/classes
exports.listClasses = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const [rows] = await db.query(`
      SELECT
        id,
        title,
        description,
        image_url,
        age_min,
        age_max,
        schedule_text,
        fee,
        item_type,
        instructor_id,
        event_date,
        start_time,
        end_time,
        status,
        created_at
      FROM classes
      WHERE status = 'ACTIVE' AND item_type = 'CLASS'
      ORDER BY created_at DESC, id DESC
    `);

    return res.json(
      rows.map((row) => ({
        ...row,
        fee: Number(row.fee || 0),
      }))
    );
  } catch (err) {
    console.error("listClasses error:", err);
    return res.status(500).json({ message: "Failed to load classes", error: err.message });
  }
};

/* ------------------------------- CHILDREN ------------------------------ */

// POST /api/parent/children
exports.addChild = async (req, res) => {
  try {
    await ensureChildrenTableShape();

    const parentId = req.user.id;
    const { child_name, full_name, date_of_birth = null, medical_notes = null } = req.body || {};

    const name = (child_name || full_name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "child_name is required" });
    }

    const [result] = await db.query(
      `INSERT INTO children (parent_user_id, parent_id, full_name, child_name, date_of_birth, medical_notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [parentId, parentId, name, name, date_of_birth || null, medical_notes || null]
    );

    return res.status(201).json({
      message: "Child added successfully",
      child: {
        id: result.insertId,
        child_name: name,
        full_name: name,
        parent_user_id: parentId,
      },
    });
  } catch (err) {
    console.error("addChild error:", err);
    return res.status(500).json({ message: "Failed to add child", error: err.message });
  }
};

// GET /api/parent/children
exports.listChildren = async (req, res) => {
  try {
    await ensureChildrenTableShape();

    const parentId = req.user.id;

    const [rows] = await db.query(
      `SELECT
         id,
         parent_user_id,
         parent_id,
         full_name,
         child_name,
         date_of_birth,
         medical_notes,
         created_at
       FROM children
       WHERE parent_user_id = ? OR parent_id = ?
       ORDER BY created_at DESC, id DESC`,
      [parentId, parentId]
    );

    return res.json(
      rows.map((row) => ({
        ...row,
        child_name: row.child_name || row.full_name,
      }))
    );
  } catch (err) {
    console.error("listChildren error:", err);
    return res.status(500).json({ message: "Failed to load children", error: err.message });
  }
};

/* ------------------------------ ENROLLMENTS ----------------------------- */

// POST /api/parent/enroll
exports.enroll = async (req, res) => {
  try {
    await ensureChildrenTableShape();
    await ensureClassesTableShape();
    await ensureEnrollmentsTableShape();

    const parentId = req.user.id;
    const { child_ids, class_id } = req.body || {};

    if (!Array.isArray(child_ids) || child_ids.length === 0) {
      return res.status(400).json({ message: "child_ids must be a non-empty array" });
    }

    const classId = Number(class_id);
    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Valid class_id is required" });
    }

    const [classRows] = await db.query(
      `SELECT id, title, item_type, status
       FROM classes
       WHERE id = ?
       LIMIT 1`,
      [classId]
    );

    if (!classRows.length) {
      return res.status(404).json({ message: "Class not found" });
    }

    const cls = classRows[0];

    if (cls.status !== "ACTIVE") {
      return res.status(400).json({ message: "Selected class is not active" });
    }

    if (cls.item_type !== "CLASS") {
      return res.status(400).json({ message: "Only CLASS items can be enrolled" });
    }

    const enrolled = [];
    const already_enrolled = [];
    const invalid_children = [];

    for (const rawChildId of child_ids) {
      const childId = Number(rawChildId);

      if (!Number.isInteger(childId) || childId <= 0) {
        invalid_children.push(rawChildId);
        continue;
      }

      const [childRows] = await db.query(
        `SELECT id, full_name, child_name
         FROM children
         WHERE id = ? AND (parent_user_id = ? OR parent_id = ?)
         LIMIT 1`,
        [childId, parentId, parentId]
      );

      if (!childRows.length) {
        invalid_children.push(rawChildId);
        continue;
      }

      const [existing] = await db.query(
        `SELECT id
         FROM enrollments
         WHERE child_id = ? AND class_id = ?
         LIMIT 1`,
        [childId, classId]
      );

      if (existing.length) {
        already_enrolled.push({
          child_id: childId,
          enrollment_id: existing[0].id,
        });
        continue;
      }

      const [result] = await db.query(
        `INSERT INTO enrollments (child_id, class_id, status)
         VALUES (?, ?, 'PENDING')`,
        [childId, classId]
      );

      enrolled.push({
        child_id: childId,
        enrollment_id: result.insertId,
      });
    }

    return res.status(201).json({
      message: "Enrollment process completed",
      class_id: classId,
      enrolled,
      already_enrolled,
      invalid_children,
    });
  } catch (err) {
    console.error("parent enroll error:", err);
    return res.status(500).json({ message: "Failed to enroll", error: err.message });
  }
};

// GET /api/parent/enrollments
exports.myEnrollments = async (req, res) => {
  try {
    await ensureChildrenTableShape();
    await ensureClassesTableShape();
    await ensureEnrollmentsTableShape();

    const parentId = req.user.id;

    const [rows] = await db.query(
      `SELECT
         e.id,
         e.child_id,
         e.class_id,
         e.status,
         e.created_at,
         c.full_name AS child_name,
         cl.title AS class_title,
         cl.fee
       FROM enrollments e
       JOIN children c
         ON c.id = e.child_id
       JOIN classes cl
         ON cl.id = e.class_id
       WHERE c.parent_user_id = ? OR c.parent_id = ?
       ORDER BY e.created_at DESC, e.id DESC`,
      [parentId, parentId]
    );

    return res.json(
      rows.map((row) => ({
        ...row,
        fee: Number(row.fee || 0),
      }))
    );
  } catch (err) {
    console.error("myEnrollments error:", err);
    return res.status(500).json({ message: "Failed to load enrollments", error: err.message });
  }
};

/* -------------------------------- PAYMENTS ------------------------------ */

// GET /api/parent/payments
exports.myPayments = async (req, res) => {
  try {
    await ensurePaymentsTableShape();
    await ensureChildrenTableShape();
    await ensureClassesTableShape();
    await ensureEnrollmentsTableShape();

    const parentId = req.user.id;

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
         p.notes,
         p.bank_slip_name,
         p.bank_slip_data,
         p.confirmed_by,
         p.confirmed_at,
         p.created_at,
         c.full_name AS child_name,
         cl.title AS class_title
       FROM payments p
       LEFT JOIN enrollments e
         ON e.id = p.enrollment_id
       LEFT JOIN children c
         ON c.id = e.child_id
       LEFT JOIN classes cl
         ON cl.id = e.class_id
       WHERE p.parent_user_id = ?
       ORDER BY p.created_at DESC, p.id DESC`,
      [parentId]
    );

    return res.json(
      rows.map((row) => ({
        ...row,
        amount: Number(row.amount || 0),
      }))
    );
  } catch (err) {
    console.error("myPayments error:", err);
    return res.status(500).json({ message: "Failed to load payments", error: err.message });
  }
};

/* -------------------------------- BOOKINGS ------------------------------ */

// POST /api/parent/bookings
exports.createBooking = async (req, res) => {
  try {
    await ensureBookingsTableShape();

    const userId = req.user.id;
    const { booking_type, booking_date, time_slot, notes } = req.body;

    if (!booking_type || !booking_date) {
      return res.status(400).json({
        message: "booking_type and booking_date are required",
      });
    }

    const allowed = ["PLAY_AREA", "PARTY", "EVENT", "CLASS"];
    if (!allowed.includes(booking_type)) {
      return res.status(400).json({ message: "Invalid booking_type" });
    }

    const [result] = await db.query(
      `
      INSERT INTO bookings
        (user_id, booking_type, booking_date, time_slot, notes, status)
      VALUES
        (?, ?, ?, ?, ?, 'PENDING')
      `,
      [userId, booking_type, booking_date, time_slot || null, notes || null]
    );

    return res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({
      message: "Failed to create booking",
      error: err.message,
    });
  }
};

// GET /api/parent/bookings
exports.getMyBookings = async (req, res) => {
  try {
    await ensureBookingsTableShape();

    const userId = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        id,
        booking_type,
        booking_date,
        time_slot,
        notes,
        status,
        created_at
      FROM bookings
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      `,
      [userId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({
      message: "Failed to load bookings",
      error: err.message,
    });
  }
};