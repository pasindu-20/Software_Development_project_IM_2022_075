require("dotenv").config();
const db = require("../src/config/db");
const bcrypt = require("bcrypt");

(async () => {
  try {
    const rootEmail = "root@poddo.lk";
    const rootPassword = "Root@12345"; // change after first login
    const hash = await bcrypt.hash(rootPassword, 10);

    // create roles if missing
    await db.query(
      "INSERT IGNORE INTO roles (id, name) VALUES (1,'ADMIN'),(2,'RECEPTIONIST'),(3,'INSTRUCTOR'),(4,'PARENT')"
    );

    // check existing
    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [rootEmail]);
    if (exists.length) {
      console.log("✅ Root admin already exists");
      process.exit(0);
    }

    await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role_id)
       VALUES (?,?,?,?,1)`,
      ["Root Admin", rootEmail, "0000000000", hash]
    );

    console.log("✅ Root admin created");
    console.log("Email:", rootEmail);
    console.log("Password:", rootPassword);
    process.exit(0);
  } catch (e) {
    console.error("❌ Seed failed:", e.message);
    process.exit(1);
  }
})();
