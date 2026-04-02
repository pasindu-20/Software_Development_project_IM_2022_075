const db = require("../config/db");
const { audit } = require("../utils/audit");
const {
  sendInquiryAcknowledgementEmail,
} = require("../services/inquiryEmail.service");

async function ensureInquiryTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_inquiries (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(150) NULL,
      inquiry_type VARCHAR(50) NOT NULL,
      message TEXT NULL,
      preferred_program_id INT NULL,
      assigned_to INT NULL,
      status ENUM('NEW','CONTACTED','FOLLOW_UP','CONVERTED','CLOSED') NOT NULL DEFAULT 'NEW',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.query(
      `ALTER TABLE customer_inquiries ADD COLUMN assigned_to INT NULL AFTER preferred_program_id`
    );
  } catch (err) {}

  try {
    await db.query(
      `ALTER TABLE customer_inquiries ADD COLUMN status ENUM('NEW','CONTACTED','FOLLOW_UP','CONVERTED','CLOSED') NOT NULL DEFAULT 'NEW' AFTER assigned_to`
    );
  } catch (err) {}

  try {
    await db.query(
      `ALTER TABLE customer_inquiries ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    );
  } catch (err) {}

  await db.query(`
    CREATE TABLE IF NOT EXISTS inquiry_followups (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      inquiry_id INT NOT NULL,
      user_id INT NOT NULL,
      note TEXT NOT NULL,
      followup_date DATE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function normalizePhone(value) {
  return String(value || "").replace(/[\s-]/g, "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isValidSriLankanPhone(value) {
  return /^(?:0\d{9}|\+94\d{9}|94\d{9})$/.test(String(value || "").trim());
}

// PUBLIC: Create inquiry
exports.createInquiry = async (req, res) => {
  try {
    await ensureInquiryTables();

    const customer_name = String(req.body.customer_name || "").trim();
    const email = String(req.body.email || "").trim();
    const phone = normalizePhone(req.body.phone || "");
    const inquiry_type = String(req.body.inquiry_type || "").trim();
    const message = String(req.body.message || "").trim();
    const preferred_program_id = req.body.preferred_program_id ?? null;

    if (!customer_name || !email || !phone || !inquiry_type || !message) {
      return res.status(400).json({
        message:
          "customer_name, email, phone, inquiry_type, and message are required",
      });
    }

    if (customer_name.length < 3) {
      return res.status(400).json({
        message: "Name must be at least 3 characters",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (!isValidSriLankanPhone(phone)) {
      return res.status(400).json({
        message: "Enter a valid Sri Lankan phone number",
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        message: "Message must be at least 10 characters",
      });
    }

    const [result] = await db.query(
      `INSERT INTO customer_inquiries
       (customer_name, phone, email, inquiry_type, message, preferred_program_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        phone,
        email,
        inquiry_type,
        message,
        preferred_program_id,
        "NEW",
      ]
    );

    await audit({
      user_id: null,
      action: "INQUIRY_CREATED",
      table_name: "customer_inquiries",
      record_id: result.insertId,
      ip_address: req.ip,
    });

    let emailSent = false;

    try {
      await sendInquiryAcknowledgementEmail({
        customerName: customer_name,
        email,
        phone,
        inquiryType: inquiry_type,
        message,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error("Inquiry acknowledgement email failed:", mailErr);
    }

    return res.status(201).json({
      message: emailSent
        ? "Inquiry submitted successfully. A confirmation email has been sent."
        : "Inquiry submitted successfully, but confirmation email could not be sent.",
      inquiry_id: result.insertId,
      email_sent: emailSent,
    });
  } catch (err) {
    console.error("createInquiry error:", err);
    return res.status(500).json({ message: "Failed to submit inquiry" });
  }
};

// PROTECTED: List inquiries (Admin/Receptionist)
exports.getAllInquiries = async (req, res) => {
  try {
    await ensureInquiryTables();

    const { status, assigned_to } = req.query;

    let sql = `SELECT * FROM customer_inquiries WHERE 1=1`;
    const params = [];

    if (status) {
      sql += ` AND status=?`;
      params.push(status);
    }
    if (assigned_to) {
      sql += ` AND assigned_to=?`;
      params.push(Number(assigned_to));
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(sql, params);

    await audit({
      user_id: req.user.id,
      action: "INQUIRY_LIST_VIEWED",
      table_name: "customer_inquiries",
      record_id: null,
      ip_address: req.ip,
    });

    return res.json(rows);
  } catch (err) {
    console.error("getAllInquiries error:", err);
    return res.status(500).json({ message: "Failed to fetch inquiries" });
  }
};

// PROTECTED: Assign inquiry to staff
exports.assignInquiry = async (req, res) => {
  try {
    await ensureInquiryTables();

    const inquiryId = Number(req.params.id);
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({ message: "assigned_to is required" });
    }

    await db.query(
      `UPDATE customer_inquiries SET assigned_to=?, status='CONTACTED' WHERE id=?`,
      [Number(assigned_to), inquiryId]
    );

    await audit({
      user_id: req.user.id,
      action: "INQUIRY_ASSIGNED",
      table_name: "customer_inquiries",
      record_id: inquiryId,
      ip_address: req.ip,
    });

    return res.json({ message: "Inquiry assigned successfully" });
  } catch (err) {
    console.error("assignInquiry error:", err);
    return res.status(500).json({ message: "Failed to assign inquiry" });
  }
};

// PROTECTED: Update inquiry status
exports.updateInquiryStatus = async (req, res) => {
  try {
    await ensureInquiryTables();

    const inquiryId = Number(req.params.id);
    const { status } = req.body;

    const allowed = ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await db.query(`UPDATE customer_inquiries SET status=? WHERE id=?`, [
      status,
      inquiryId,
    ]);

    await audit({
      user_id: req.user.id,
      action: "INQUIRY_STATUS_UPDATED",
      table_name: "customer_inquiries",
      record_id: inquiryId,
      ip_address: req.ip,
    });

    return res.json({ message: "Inquiry status updated" });
  } catch (err) {
    console.error("updateInquiryStatus error:", err);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

// PROTECTED: Add follow-up note
exports.addFollowup = async (req, res) => {
  try {
    await ensureInquiryTables();

    const inquiryId = Number(req.params.id);
    const { note, followup_date = null } = req.body;

    if (!note) {
      return res.status(400).json({ message: "note is required" });
    }

    const [result] = await db.query(
      `INSERT INTO inquiry_followups (inquiry_id, user_id, note, followup_date)
       VALUES (?, ?, ?, ?)`,
      [inquiryId, req.user.id, note, followup_date]
    );

    await audit({
      user_id: req.user.id,
      action: "INQUIRY_FOLLOWUP_ADDED",
      table_name: "inquiry_followups",
      record_id: result.insertId,
      ip_address: req.ip,
    });

    return res.status(201).json({ message: "Follow-up added" });
  } catch (err) {
    console.error("addFollowup error:", err);
    return res.status(500).json({ message: "Failed to add follow-up" });
  }
};

// PROTECTED: Get follow-ups for inquiry
exports.getFollowups = async (req, res) => {
  try {
    await ensureInquiryTables();

    const inquiryId = Number(req.params.id);

    const [rows] = await db.query(
      `SELECT f.*, u.full_name AS staff_name
       FROM inquiry_followups f
       JOIN users u ON u.id = f.user_id
       WHERE f.inquiry_id=?
       ORDER BY f.created_at DESC`,
      [inquiryId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getFollowups error:", err);
    return res.status(500).json({ message: "Failed to fetch follow-ups" });
  }
};