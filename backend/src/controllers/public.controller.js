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