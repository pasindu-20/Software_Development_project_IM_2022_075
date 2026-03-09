const db = require("../config/db");

async function ensureClassesTypeColumn() {
  try {
    await db.query(`
      ALTER TABLE classes
      ADD COLUMN item_type ENUM('CLASS','EVENT') NOT NULL DEFAULT 'CLASS'
    `);
  } catch {}
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
  } catch {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN age_group VARCHAR(100) NULL`);
  } catch {}
  try {
    await db.query(`ALTER TABLE play_areas ADD COLUMN image_url TEXT NULL`);
  } catch {}
}

exports.listPublicClasses = async (req, res) => {
  try {
    await ensureClassesTypeColumn();

    const [rows] = await db.query(
      `SELECT id, item_type, title, description, age_min, age_max, fee, status, created_at
       FROM classes
       WHERE status='ACTIVE' AND item_type='CLASS'
       ORDER BY created_at DESC, id DESC`
    );

    res.json(
      rows.map((row) => ({
        ...row,
        age: `${row.age_min}-${row.age_max} years`,
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
    await ensureClassesTypeColumn();

    const [rows] = await db.query(
      `SELECT id, item_type, title, description, age_min, age_max, fee, status, created_at
       FROM classes
       WHERE status='ACTIVE' AND item_type='EVENT'
       ORDER BY created_at DESC, id DESC`
    );

    res.json(
      rows.map((row) => ({
        ...row,
        age: `${row.age_min}-${row.age_max} years`,
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

    const [rows] = await db.query(
      `SELECT id, name, description, age_group, image_url, capacity, price, status, created_at
       FROM play_areas
       WHERE status='ACTIVE'
       ORDER BY created_at DESC, id DESC`
    );

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