require("dotenv").config();
const db = require("./src/config/db");

(async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ MySQL connected from Node.js");
    process.exit(0);
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
})();
