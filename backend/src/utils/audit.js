const db = require("../config/db");

// Safe audit log helper (non-blocking usage recommended)
exports.audit = async ({ user_id, action, table_name, record_id, ip_address }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id || null, action, table_name || null, record_id || null, ip_address || null]
    );
  } catch (err) {
    console.error("AUDIT LOG FAILED:", err.message);
  }
};
