const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const { sendMail } = require("../utils/mailer");

function generateTempPassword() {
  return "Tmp@" + crypto.randomBytes(4).toString("hex");
}

function buildStaffWelcomeEmail({ full_name, email, role, tempPassword }) {
  const app = process.env.APP_NAME || "Poddo Playhouse";
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const signInLink = `${frontend}/#/admin/signin`;
  const changePasswordLink = `${frontend}/#/auth/change-password`;

  return {
    subject: `${app} - Your Staff Account Details`,
    text:
      `Hello ${full_name},\n\n` +
      `A ${role.toLowerCase()} account has been created for you in ${app}.\n\n` +
      `Email: ${email}\n` +
      `Temporary Password: ${tempPassword}\n\n` +
      `Staff Sign In: ${signInLink}\n` +
      `Change Password Page: ${changePasswordLink}\n\n` +
      `Please sign in with the temporary password. On your first login, you will be asked to change your password.\n\n` +
      `Thank you.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="margin-bottom: 12px;">Welcome to ${app}</h2>

        <p>Hello ${full_name},</p>
        <p>A <strong>${role}</strong> staff account has been created for you.</p>

        <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0 0 10px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p style="margin: 0;"><strong>Important:</strong> You must change this password on your first login.</p>
        </div>

        <p style="margin: 18px 0 10px;">Use this link to sign in:</p>
        <p style="margin: 0 0 18px;">
          <a href="${signInLink}" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
            Open Staff Sign In
          </a>
        </p>

        <p style="margin: 18px 0 8px;">Change password page:</p>
        <p style="margin: 0 0 18px; word-break: break-all;">
          <a href="${changePasswordLink}" target="_blank">${changePasswordLink}</a>
        </p>

        <p style="font-size: 13px; color: #6b7280;">
          If you did not expect this account, please contact the administrator.
        </p>
      </div>
    `,
  };
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

async function ensurePartyPackagesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS party_packages (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      package_code VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_children INT NOT NULL DEFAULT 0,
      duration_text VARCHAR(150) NULL,
      badge_text VARCHAR(100) NULL,
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      features_json LONGTEXT NULL,
      status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN description TEXT NULL AFTER name`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER description`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN max_children INT NOT NULL DEFAULT 0 AFTER price`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN duration_text VARCHAR(150) NULL AFTER max_children`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN badge_text VARCHAR(100) NULL AFTER duration_text`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER badge_text`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_featured`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN features_json LONGTEXT NULL AFTER sort_order`);
  } catch (err) {}
  try {
    await db.query(`ALTER TABLE party_packages ADD COLUMN status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE' AFTER features_json`);
  } catch (err) {}

  const [countRows] = await db.query(`SELECT COUNT(*) AS count FROM party_packages`);
  const count = Number(countRows[0]?.count || 0);

  if (count === 0) {
    await db.query(
      `INSERT INTO party_packages
        (package_code, name, description, price, max_children, duration_text, badge_text, is_featured, sort_order, features_json, status)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "Package 01",
        "Classic Party",
        "Perfect for intimate birthday celebrations.",
        25000,
        15,
        "2-hour party room access",
        null,
        0,
        1,
        JSON.stringify([
          "Up to 15 children",
          "2-hour party room access",
          "Basic themed decorations",
          "Birthday cake (1kg)",
          "Party host included",
          "Simple goodie bags",
          "Complimentary invitations (15)",
        ]),
        "ACTIVE",
        "Package 02",
        "Deluxe Party",
        "Ideal for a larger premium celebration.",
        50000,
        25,
        "3-hour party room access",
        "Premium",
        1,
        2,
        JSON.stringify([
          "Up to 25 children",
          "3-hour party room access",
          "Premium themed decorations",
          "Birthday cake (2kg)",
          "Party host & assistant",
          "Premium goodie bags",
          "Professional photography",
          "Custom invitations (25)",
          "Food & beverages included",
        ]),
        "ACTIVE",
      ]
    );
  }
}

function normalizePartyPackageFeatures(featuresInput, maxChildren, durationText) {
  let features = [];

  if (Array.isArray(featuresInput)) {
    features = featuresInput;
  } else if (typeof featuresInput === "string") {
    features = featuresInput.split(/\r?\n|\|/g);
  }

  const cleaned = features
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (!cleaned.length) {
    if (Number(maxChildren) > 0) {
      cleaned.push(`Up to ${Number(maxChildren)} children`);
    }
    if (durationText && String(durationText).trim()) {
      cleaned.push(String(durationText).trim());
    }
  }

  return cleaned;
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

    const mailPayload = buildStaffWelcomeEmail({
      full_name,
      email,
      role,
      tempPassword,
    });

    try {
      await sendMail({
        to: email,
        subject: mailPayload.subject,
        text: mailPayload.text,
        html: mailPayload.html,
      });
    } catch (mailErr) {
      console.error("createStaff email error:", mailErr);
      return res.status(201).json({
        message: "Staff account created, but email could not be sent",
        emailSent: false,
        tempPassword,
      });
    }

    res.status(201).json({
      message: "Staff account created and email sent",
      emailSent: true,
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

async function tableExists(tableName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [tableName, columnName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function getPaymentsEffectiveDateExpression() {
  if (!(await tableExists("payments"))) return null;

  const columns = [];

  if (await columnExists("payments", "paid_at")) columns.push("paid_at");
  if (await columnExists("payments", "confirmed_at")) columns.push("confirmed_at");
  if (await columnExists("payments", "created_at")) columns.push("created_at");
  if (await columnExists("payments", "updated_at")) columns.push("updated_at");

  if (!columns.length) return null;

  return `COALESCE(${columns.join(", ")})`;
}

function formatSqlDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildLastThreeMonthsRevenue(rows) {
  const now = new Date();
  const totalsByMonth = new Map(
    rows.map((row) => [row.month, Number(row.total || 0)])
  );

  const data = [];

  for (let offset = 2; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    data.push({
      month: monthKey,
      monthLabel: date.toLocaleString("en-US", { month: "short" }),
      fullMonthLabel: date.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      total: totalsByMonth.get(monthKey) || 0,
    });
  }

  return data;
}

exports.dashboardCards = async (req, res) => {
  try {
    let totalInquiries = 0;
    let newInquiries = 0;
    let totalEnrollments = 0;
    let totalRevenue = 0;

    if (await tableExists("customer_inquiries")) {
      const [[inquiries]] = await db.query(`
    SELECT
      COUNT(*) AS totalInquiries,
      SUM(
        CASE
          WHEN created_at >= NOW() - INTERVAL 7 DAY THEN 1
          ELSE 0
        END
      ) AS newInquiries
    FROM customer_inquiries
  `);

      totalInquiries = Number(inquiries?.totalInquiries || 0);
      newInquiries = Number(inquiries?.newInquiries || 0);
    }

    if (await tableExists("enrollments")) {
      const [[enrollments]] = await db.query(`
        SELECT COUNT(*) AS totalEnrollments
        FROM enrollments
      `);

      totalEnrollments = Number(enrollments?.totalEnrollments || 0);
    }

    if (await tableExists("payments")) {
      const [[revenue]] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) AS totalRevenue
        FROM payments
        WHERE payment_status IN ('SUCCESS', 'PAID')
      `);

      totalRevenue = Number(revenue?.totalRevenue || 0);
    }

    res.json({
      totalInquiries,
      newInquiries,
      totalEnrollments,
      totalRevenue,
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
    const hasPaymentsTable = await tableExists("payments");
    if (!hasPaymentsTable) {
      return res.json([]);
    }

    const effectiveDateExpr = await getPaymentsEffectiveDateExpression();
    if (!effectiveDateExpr) {
      return res.json([]);
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [rows] = await db.query(
      `
      SELECT
        DATE_FORMAT(${effectiveDateExpr}, '%Y-%m') AS month,
        COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE payment_status IN ('SUCCESS', 'PAID')
        AND ${effectiveDateExpr} IS NOT NULL
        AND ${effectiveDateExpr} >= ?
        AND ${effectiveDateExpr} < ?
      GROUP BY DATE_FORMAT(${effectiveDateExpr}, '%Y-%m')
      ORDER BY month ASC
      `,
      [formatSqlDate(startDate), formatSqlDate(endDate)]
    );

    return res.json(buildLastThreeMonthsRevenue(rows));
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
             c.schedule_text,
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
      schedule_text,
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

    const safeType = ["CLASS", "EVENT"].includes(item_type) ? item_type : "CLASS";
    const safeFee = Number(fee || 0);
    const safeScheduleText =
      schedule_text && String(schedule_text).trim()
        ? String(schedule_text).trim()
        : null;
    const safeAgeMin = age_min === "" || age_min == null ? null : Number(age_min);
    const safeAgeMax = age_max === "" || age_max == null ? null : Number(age_max);
    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeImageUrl =
      image_url && String(image_url).trim() ? String(image_url).trim() : null;
    const safeInstructorId = Number(instructor_id);

    if (safeType === "CLASS" && !safeScheduleText) {
      return res.status(400).json({ message: "schedule_text is required for classes" });
    }

    if (safeType === "EVENT" && !event_date) {
      return res.status(400).json({ message: "event_date is required for events" });
    }

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    if (!end_time) {
      return res.status(400).json({ message: "end_time is required" });
    }

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
      return res.status(400).json({
        message: "age_max must be greater than or equal to age_min",
      });
    }

    if (!Number.isFinite(safeFee) || safeFee < 0) {
      return res.status(400).json({ message: "fee must be 0 or more" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: "end_time must be greater than start_time" });
    }

    const [instructorRows] = await db.query(
      `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'INSTRUCTOR'
      LIMIT 1
    `,
      [safeInstructorId]
    );

    if (!instructorRows.length) {
      return res.status(400).json({ message: "Selected instructor is invalid" });
    }

    const [result] = await db.query(
      `INSERT INTO classes (
        item_type, title, description, image_url, age_min, age_max, schedule_text, fee,
        instructor_id, event_date, start_time, end_time, status
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeType,
        String(title).trim(),
        description ? String(description).trim() : null,
        safeImageUrl,
        safeAgeMin,
        safeAgeMax,
        safeType === "CLASS" ? safeScheduleText : null,
        safeFee,
        safeInstructorId,
        safeType === "EVENT" ? event_date : null,
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
      schedule_text,
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

    const safeType = ["CLASS", "EVENT"].includes(item_type) ? item_type : "CLASS";
    const safeFee = Number(fee || 0);
    const safeScheduleText =
      schedule_text && String(schedule_text).trim()
        ? String(schedule_text).trim()
        : null;
    const safeAgeMin = age_min === "" || age_min == null ? null : Number(age_min);
    const safeAgeMax = age_max === "" || age_max == null ? null : Number(age_max);
    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeImageUrl =
      image_url && String(image_url).trim() ? String(image_url).trim() : null;
    const safeInstructorId = Number(instructor_id);

    if (safeType === "CLASS" && !safeScheduleText) {
      return res.status(400).json({ message: "schedule_text is required for classes" });
    }

    if (safeType === "EVENT" && !event_date) {
      return res.status(400).json({ message: "event_date is required for events" });
    }

    if (!start_time) {
      return res.status(400).json({ message: "start_time is required" });
    }

    if (!end_time) {
      return res.status(400).json({ message: "end_time is required" });
    }

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
      return res.status(400).json({
        message: "age_max must be greater than or equal to age_min",
      });
    }

    if (!Number.isFinite(safeFee) || safeFee < 0) {
      return res.status(400).json({ message: "fee must be 0 or more" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: "end_time must be greater than start_time" });
    }

    const [instructorRows] = await db.query(
      `
      SELECT u.id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ? AND r.name = 'INSTRUCTOR'
      LIMIT 1
    `,
      [safeInstructorId]
    );

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
           schedule_text = ?,
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
        safeType === "CLASS" ? safeScheduleText : null,
        safeFee,
        safeInstructorId,
        safeType === "EVENT" ? event_date : null,
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

exports.updatePlayArea = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

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
      `UPDATE play_areas
       SET name = ?, description = ?, age_group = ?, image_url = ?, capacity = ?, price = ?, status = ?
       WHERE id = ?`,
      [
        String(name).trim(),
        description ? String(description).trim() : null,
        age_group ? String(age_group).trim() : null,
        image_url ? String(image_url).trim() : null,
        Number(capacity),
        Number(price),
        safeStatus,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Play area not found" });
    }

    res.json({ message: "Play area updated successfully" });
  } catch (err) {
    console.error("updatePlayArea error:", err);
    res.status(500).json({ message: "Failed to update play area" });
  }
};

exports.updatePlayAreaStatus = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "status must be ACTIVE or INACTIVE" });
    }

    const [result] = await db.query(
      `UPDATE play_areas SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Play area not found" });
    }

    res.json({ message: `Play area marked as ${status}` });
  } catch (err) {
    console.error("updatePlayAreaStatus error:", err);
    res.status(500).json({ message: "Failed to update play area status" });
  }
};

exports.deletePlayArea = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    const [result] = await db.query(
      `DELETE FROM play_areas WHERE id = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Play area not found" });
    }

    res.json({ message: "Play area deleted successfully" });
  } catch (err) {
    console.error("deletePlayArea error:", err);
    res.status(500).json({ message: "Failed to delete play area" });
  }
};

exports.listPartyPackages = async (req, res) => {
  try {
    await ensurePartyPackagesTable();

    const [rows] = await db.query(`
      SELECT id, package_code, name, description, price, max_children, duration_text, badge_text,
             is_featured, sort_order, features_json, status, created_at, updated_at
      FROM party_packages
      ORDER BY sort_order ASC, created_at ASC, id ASC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        price: Number(row.price || 0),
        max_children: Number(row.max_children || 0),
        is_featured: Boolean(row.is_featured),
        features: (() => {
          try {
            const parsed = JSON.parse(row.features_json || "[]");
            return Array.isArray(parsed) ? parsed : [];
          } catch (err) {
            return [];
          }
        })(),
      }))
    );
  } catch (err) {
    console.error("listPartyPackages error:", err);
    res.status(500).json({ message: "Failed to load party packages" });
  }
};

exports.createPartyPackage = async (req, res) => {
  try {
    await ensurePartyPackagesTable();

    const {
      package_code,
      name,
      description,
      price,
      max_children,
      duration_text,
      badge_text,
      is_featured,
      sort_order,
      features,
      status,
    } = req.body;

    if (!package_code || !String(package_code).trim()) {
      return res.status(400).json({ message: "package_code is required" });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "price must be 0 or more" });
    }

    if (!Number.isFinite(Number(max_children)) || Number(max_children) <= 0) {
      return res.status(400).json({ message: "max_children must be a positive number" });
    }

    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeFeatures = normalizePartyPackageFeatures(features, max_children, duration_text);

    const [result] = await db.query(
      `INSERT INTO party_packages
        (package_code, name, description, price, max_children, duration_text, badge_text, is_featured, sort_order, features_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(package_code).trim(),
        String(name).trim(),
        description ? String(description).trim() : null,
        Number(price),
        Number(max_children),
        duration_text ? String(duration_text).trim() : null,
        badge_text ? String(badge_text).trim() : null,
        Number(is_featured) ? 1 : 0,
        Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
        JSON.stringify(safeFeatures),
        safeStatus,
      ]
    );

    res.status(201).json({
      message: "Party package created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error("createPartyPackage error:", err);
    res.status(500).json({ message: "Failed to create party package" });
  }
};

exports.updatePartyPackage = async (req, res) => {
  try {
    await ensurePartyPackagesTable();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    const {
      package_code,
      name,
      description,
      price,
      max_children,
      duration_text,
      badge_text,
      is_featured,
      sort_order,
      features,
      status,
    } = req.body;

    if (!package_code || !String(package_code).trim()) {
      return res.status(400).json({ message: "package_code is required" });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "price must be 0 or more" });
    }

    if (!Number.isFinite(Number(max_children)) || Number(max_children) <= 0) {
      return res.status(400).json({ message: "max_children must be a positive number" });
    }

    const safeStatus = ["ACTIVE", "INACTIVE"].includes(status) ? status : "ACTIVE";
    const safeFeatures = normalizePartyPackageFeatures(features, max_children, durationText);

    const [result] = await db.query(
      `UPDATE party_packages
       SET package_code = ?, name = ?, description = ?, price = ?, max_children = ?, duration_text = ?,
           badge_text = ?, is_featured = ?, sort_order = ?, features_json = ?, status = ?
       WHERE id = ?`,
      [
        String(package_code).trim(),
        String(name).trim(),
        description ? String(description).trim() : null,
        Number(price),
        Number(max_children),
        duration_text ? String(duration_text).trim() : null,
        badge_text ? String(badge_text).trim() : null,
        Number(is_featured) ? 1 : 0,
        Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
        JSON.stringify(safeFeatures),
        safeStatus,
        id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Party package not found" });
    }

    res.json({ message: "Party package updated successfully" });
  } catch (err) {
    console.error("updatePartyPackage error:", err);
    res.status(500).json({ message: "Failed to update party package" });
  }
};

exports.updatePartyPackageStatus = async (req, res) => {
  try {
    await ensurePartyPackagesTable();

    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "status must be ACTIVE or INACTIVE" });
    }

    const [result] = await db.query(
      `UPDATE party_packages SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Party package not found" });
    }

    res.json({ message: `Party package marked as ${status}` });
  } catch (err) {
    console.error("updatePartyPackageStatus error:", err);
    res.status(500).json({ message: "Failed to update party package status" });
  }
};

exports.deletePartyPackage = async (req, res) => {
  try {
    await ensurePartyPackagesTable();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Valid id is required" });
    }

    const [result] = await db.query(`DELETE FROM party_packages WHERE id = ?`, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Party package not found" });
    }

    res.json({ message: "Party package deleted successfully" });
  } catch (err) {
    console.error("deletePartyPackage error:", err);
    res.status(500).json({ message: "Failed to delete party package" });
  }
};

exports.listReservations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.booking_type,
        b.booking_date,
        b.time_slot,
        b.status,
        b.notes,
        b.created_at,
        u.full_name AS customer_name,
        u.phone AS customer_phone
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY b.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listReservations error:", err);
    res.status(500).json({ message: "Failed to load reservations" });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.payment_no,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.transaction_ref,
        p.paid_at,
        e.child_id,
        u.full_name AS customer_name
      FROM payments p
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN users u ON u.id = e.child_id
      ORDER BY p.paid_at DESC, p.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listPayments error:", err);
    res.status(500).json({ message: "Failed to load payments" });
  }
};