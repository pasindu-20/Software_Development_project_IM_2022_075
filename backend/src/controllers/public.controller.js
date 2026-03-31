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

function convert24HourToMinutes(time24) {
  const value = String(time24 || "").trim();
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour * 60 + minute;
}

function convert12HourToMinutes(time12h) {
  const value = String(time12h || "").trim();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return hour * 60 + minute;
}

function parseTimeSlotToRange(timeSlot) {
  const parts = String(timeSlot || "").split(" - ");
  if (parts.length !== 2) return null;

  const startMinutes = convert12HourToMinutes(parts[0]);
  const endMinutes = convert12HourToMinutes(parts[1]);

  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;

  return { startMinutes, endMinutes };
}

function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function formatAge(row) {
  if (row.age_min == null && row.age_max == null) return null;
  if (row.age_min != null && row.age_max != null) return `${row.age_min}-${row.age_max} years`;
  if (row.age_min != null) return `${row.age_min}+ years`;
  return `Up to ${row.age_max} years`;
}

exports.listPublicClasses = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const [rows] = await db.query(`
      SELECT id, item_type, title, description, image_url, age_min, age_max, fee, instructor_id, event_date, start_time, end_time, status, created_at
      FROM classes
      WHERE status='ACTIVE' AND item_type='CLASS'
      ORDER BY created_at DESC, id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        age: formatAge(row),
        fee: Number(row.fee || 0),
      }))
    );
  } catch (e) {
    console.error("listPublicClasses error:", e);
    res.status(500).json({ message: "Failed to load classes" });
  }
};

exports.listPublicEvents = async (req, res) => {
  try {
    await ensureClassesTableShape();

    const [rows] = await db.query(`
      SELECT id, item_type, title, description, image_url, age_min, age_max, fee, instructor_id, event_date, start_time, end_time, status, created_at
      FROM classes
      WHERE status='ACTIVE' AND item_type='EVENT'
      ORDER BY created_at DESC, id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        age: formatAge(row),
        fee: Number(row.fee || 0),
      }))
    );
  } catch (e) {
    console.error("listPublicEvents error:", e);
    res.status(500).json({ message: "Failed to load events" });
  }
};

exports.listPublicPlayAreas = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const [rows] = await db.query(`
      SELECT id, name, description, age_group, image_url, capacity, price, status, created_at
      FROM play_areas
      WHERE status='ACTIVE'
      ORDER BY created_at DESC, id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        capacity: Number(row.capacity || 0),
        price: Number(row.price || 0),
      }))
    );
  } catch (e) {
    console.error("listPublicPlayAreas error:", e);
    res.status(500).json({ message: "Failed to load play areas" });
  }
};

exports.getPlayAreaAvailability = async (req, res) => {
  try {
    await ensurePlayAreasTable();

    const playAreaId = Number(req.query.play_area_id);
    const bookingDate = String(req.query.booking_date || "").trim();
    const startTime = String(req.query.start_time || "").trim();
    const endTime = String(req.query.end_time || "").trim();

    if (!Number.isInteger(playAreaId) || playAreaId <= 0) {
      return res.status(400).json({ message: "Valid play_area_id is required" });
    }

    if (!bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        message: "booking_date, start_time and end_time are required",
      });
    }

    const startMinutes = convert24HourToMinutes(startTime);
    const endMinutes = convert24HourToMinutes(endTime);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const [playAreaRows] = await db.query(
      `SELECT id, name, capacity, price, status
       FROM play_areas
       WHERE id = ?
       LIMIT 1`,
      [playAreaId]
    );

    if (!playAreaRows.length) {
      return res.status(404).json({ message: "Play area not found" });
    }

    const playArea = playAreaRows[0];
    const maxSlots = Number(playArea.capacity || 0);

    const [bookingRows] = await db.query(
      `SELECT id, time_slot, children_count
       FROM bookings
       WHERE booking_type = 'PLAY_AREA'
         AND play_area_id = ?
         AND booking_date = ?
         AND status IN ('PENDING', 'CONFIRMED')`,
      [playAreaId, bookingDate]
    );

    let bookedSlots = 0;

    for (const row of bookingRows) {
      const range = parseTimeSlotToRange(row.time_slot);
      if (!range) continue;

      const overlaps = isTimeOverlap(
        startMinutes,
        endMinutes,
        range.startMinutes,
        range.endMinutes
      );

      if (overlaps) {
        bookedSlots += Number(row.children_count || 1);
      }
    }

    const remainingSlots = Math.max(0, maxSlots - bookedSlots);

    return res.json({
      play_area_id: playAreaId,
      play_area_name: playArea.name,
      max_slots: maxSlots,
      booked_slots: bookedSlots,
      remaining_slots: remainingSlots,
      price_per_child: Number(playArea.price || 0),
    });
  } catch (e) {
    console.error("getPlayAreaAvailability error:", e);
    res.status(500).json({ message: "Failed to load play area availability" });
  }
};