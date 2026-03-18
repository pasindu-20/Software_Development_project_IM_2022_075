const db = require("../config/db");

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?`,
    [tableName, columnName]
  );
  return Number(rows[0]?.count || 0) > 0;
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
}

async function ensureAttendanceTableShape() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      child_id INT NOT NULL,
      class_id INT NOT NULL,
      attendance_date DATE NOT NULL,
      status ENUM('PRESENT','ABSENT') NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_attendance_class_date (class_id, attendance_date),
      KEY idx_attendance_child (child_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  if (await columnExists("attendance", "program_id") && !(await columnExists("attendance", "class_id"))) {
    try {
      await db.query(`ALTER TABLE attendance CHANGE COLUMN program_id class_id INT NOT NULL`);
    } catch (err) {
      console.error("Failed to rename attendance.program_id to class_id:", err);
    }
  }

  try {
    await db.query(`ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (err) {}

  try {
    await db.query(`ALTER TABLE attendance ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
  } catch (err) {}
}

async function ensureEnrollmentsTableShape() {
  if (await columnExists("enrollments", "program_id") && !(await columnExists("enrollments", "class_id"))) {
    try {
      await db.query(`ALTER TABLE enrollments CHANGE COLUMN program_id class_id INT NOT NULL`);
    } catch (err) {
      console.error("Failed to rename enrollments.program_id to class_id:", err);
    }
  }
}

async function ensureAttendanceOwnership(classId, instructorId) {
  const [rows] = await db.query(
    `SELECT id, title, item_type, status
     FROM classes
     WHERE id = ? AND instructor_id = ?
     LIMIT 1`,
    [classId, instructorId]
  );
  return rows[0] || null;
}

exports.dashboardSummary = async (req, res) => {
  try {
    await ensureClassesTableShape();
    await ensureAttendanceTableShape();
    await ensureEnrollmentsTableShape();

    const instructorId = req.user.id;

    const [[stats]] = await db.query(
      `SELECT
         COUNT(DISTINCT c.id) AS assignedClasses,
         COUNT(DISTINCT CASE WHEN c.item_type = 'CLASS' THEN c.id END) AS assignedClassOnly,
         COUNT(DISTINCT e.id) AS totalEnrollments,
         COUNT(DISTINCT CASE
           WHEN c.item_type = 'CLASS' AND a.attendance_date = CURDATE()
           THEN a.class_id
         END) AS classesMarkedToday
       FROM classes c
       LEFT JOIN enrollments e
         ON e.class_id = c.id
        AND e.status = 'ACTIVE'
       LEFT JOIN attendance a
         ON a.class_id = c.id
        AND a.attendance_date = CURDATE()
       WHERE c.instructor_id = ?
         AND c.status = 'ACTIVE'`,
      [instructorId]
    );

    const assignedClassOnly = Number(stats?.assignedClassOnly || 0);
    const classesMarkedToday = Number(stats?.classesMarkedToday || 0);

    res.json({
      assignedClasses: Number(stats?.assignedClasses || 0),
      totalEnrollments: Number(stats?.totalEnrollments || 0),
      classesMarkedToday,
      pendingAttendanceToday: Math.max(assignedClassOnly - classesMarkedToday, 0),
    });
  } catch (err) {
    console.error("instructor dashboardSummary error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to load instructor dashboard" });
  }
};

exports.listAssignedClasses = async (req, res) => {
  try {
    await ensureClassesTableShape();
    await ensureAttendanceTableShape();
    await ensureEnrollmentsTableShape();

    const instructorId = req.user.id;

    const [rows] = await db.query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.image_url,
         c.age_min,
         c.age_max,
         c.schedule_text,
         c.fee,
         c.item_type,
         c.instructor_id,
         c.event_date,
         c.start_time,
         c.end_time,
         c.status,
         COUNT(DISTINCT CASE WHEN e.status = 'ACTIVE' THEN e.id END) AS enrolled_count,
         COUNT(DISTINCT CASE WHEN a.attendance_date = CURDATE() THEN a.child_id END) AS today_attendance_count
       FROM classes c
       LEFT JOIN enrollments e
         ON e.class_id = c.id
       LEFT JOIN attendance a
         ON a.class_id = c.id
        AND a.attendance_date = CURDATE()
       WHERE c.instructor_id = ?
         AND c.status = 'ACTIVE'
       GROUP BY
         c.id, c.title, c.description, c.image_url, c.age_min, c.age_max,
         c.schedule_text, c.fee, c.item_type, c.instructor_id,
         c.event_date, c.start_time, c.end_time, c.status
       ORDER BY c.event_date ASC, c.start_time ASC, c.id DESC`,
      [instructorId]
    );

    res.json(rows);
  } catch (err) {
    console.error("instructor listAssignedClasses error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to load assigned classes" });
  }
};

exports.listEnrolledChildren = async (req, res) => {
  try {
    await ensureClassesTableShape();
    await ensureAttendanceTableShape();
    await ensureEnrollmentsTableShape();

    const instructorId = req.user.id;
    const classId = Number(req.params.classId);
    const date = req.query.date || null;

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Valid class id is required" });
    }

    const ownedClass = await ensureAttendanceOwnership(classId, instructorId);
    if (!ownedClass) {
      return res.status(404).json({ message: "Assigned class not found" });
    }

    const params = [];
    let attendanceJoin = "";

    if (date) {
      attendanceJoin = `
        LEFT JOIN attendance a
          ON a.child_id = c.id
         AND a.class_id = e.class_id
         AND a.attendance_date = ?
      `;
      params.push(date);
    }

    params.push(classId);

    const [rows] = await db.query(
      `SELECT
         c.id,
         c.full_name AS child_name,
         c.date_of_birth,
         c.medical_notes,
         parent_user.full_name AS guardian_name,
         parent_user.phone AS guardian_phone,
         e.status AS enrollment_status
         ${date ? ", a.status AS attendance_status" : ""}
       FROM enrollments e
       JOIN children c
         ON c.id = e.child_id
       JOIN users parent_user
         ON parent_user.id = c.parent_id
       ${attendanceJoin}
       WHERE e.class_id = ?
         AND e.status = 'ACTIVE'
       ORDER BY c.full_name ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("instructor listEnrolledChildren error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to load enrolled children" });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    await ensureClassesTableShape();
    await ensureAttendanceTableShape();
    await ensureEnrollmentsTableShape();

    const instructorId = req.user.id;
    const classId = Number(req.params.classId);
    const { date, records } = req.body || {};

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Valid class id is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Attendance date is required" });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "Attendance records are required" });
    }

    const ownedClass = await ensureAttendanceOwnership(classId, instructorId);
    if (!ownedClass) {
      return res.status(404).json({ message: "Assigned class not found" });
    }

    if (ownedClass.item_type !== "CLASS") {
      return res.status(400).json({ message: "Attendance can only be marked for CLASS items" });
    }

    const childIds = records.map((row) => Number(row.child_id)).filter(Boolean);

    if (!childIds.length) {
      return res.status(400).json({ message: "Valid child ids are required" });
    }

    const [allowedChildren] = await db.query(
      `SELECT child_id
       FROM enrollments
       WHERE class_id = ?
         AND child_id IN (${childIds.map(() => "?").join(",")})
         AND status = 'ACTIVE'`,
      [classId, ...childIds]
    );

    const allowedSet = new Set(allowedChildren.map((row) => Number(row.child_id)));

    await db.query("START TRANSACTION");

    for (const row of records) {
      const childId = Number(row.child_id);
      const status = row.status === "ABSENT" ? "ABSENT" : "PRESENT";

      if (!allowedSet.has(childId)) {
        await db.query("ROLLBACK");
        return res.status(400).json({ message: `Child ${childId} is not enrolled in this class` });
      }

      const [existing] = await db.query(
        `SELECT id
         FROM attendance
         WHERE child_id = ?
           AND class_id = ?
           AND attendance_date = ?
         LIMIT 1`,
        [childId, classId, date]
      );

      if (existing.length) {
        await db.query(
          `UPDATE attendance
           SET status = ?
           WHERE id = ?`,
          [status, existing[0].id]
        );
      } else {
        await db.query(
          `INSERT INTO attendance (child_id, class_id, attendance_date, status)
           VALUES (?, ?, ?, ?)`,
          [childId, classId, date, status]
        );
      }
    }

    await db.query("COMMIT");

    res.json({ message: "Attendance saved successfully" });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch (rollbackErr) {}

    console.error("instructor markAttendance error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to save attendance" });
  }
};

exports.getAttendanceRecords = async (req, res) => {
  try {
    await ensureClassesTableShape();
    await ensureAttendanceTableShape();
    await ensureEnrollmentsTableShape();

    const instructorId = req.user.id;
    const classId = Number(req.params.classId);
    const { from = null, to = null } = req.query;

    if (!Number.isInteger(classId) || classId <= 0) {
      return res.status(400).json({ message: "Valid class id is required" });
    }

    const ownedClass = await ensureAttendanceOwnership(classId, instructorId);
    if (!ownedClass) {
      return res.status(404).json({ message: "Assigned class not found" });
    }

    const params = [classId];
    let whereDate = "";

    if (from) {
      whereDate += " AND a.attendance_date >= ?";
      params.push(from);
    }

    if (to) {
      whereDate += " AND a.attendance_date <= ?";
      params.push(to);
    }

    const [rows] = await db.query(
      `SELECT
         a.id,
         a.attendance_date AS date,
         a.status,
         c.id AS child_id,
         c.full_name AS child_name,
         parent_user.full_name AS guardian_name,
         parent_user.phone AS guardian_phone
       FROM attendance a
       JOIN children c
         ON c.id = a.child_id
       LEFT JOIN users parent_user
         ON parent_user.id = c.parent_id
       WHERE a.class_id = ?
       ${whereDate}
       ORDER BY a.attendance_date DESC, c.full_name ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("instructor getAttendanceRecords error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to load attendance records" });
  }
};