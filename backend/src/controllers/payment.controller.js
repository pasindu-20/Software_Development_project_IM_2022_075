const db = require("../config/db");

function makePaymentNo(id) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `PAY-${y}${m}${day}-${String(id).padStart(6, "0")}`;
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
      MODIFY COLUMN payment_method ENUM('CARD','CASH','BANK_TRANSFER') NOT NULL
    `);
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

function isValidSlipData(data) {
  if (!data || typeof data !== "string") return false;

  return (
    data.startsWith("data:image/") ||
    data.startsWith("data:application/pdf")
  );
}

exports.createPayment = async (req, res) => {
  const parentId = req.user.id;
  const {
    enrollment_id,
    booking_id,
    payment_method,
    reference_no,
    notes,
    bank_slip_name,
    bank_slip_data,
  } = req.body || {};

  if (!payment_method || !["CARD", "CASH", "BANK_TRANSFER"].includes(payment_method)) {
    return res.status(400).json({ message: "Invalid payment_method" });
  }

  if (!enrollment_id && !booking_id) {
    return res.status(400).json({ message: "enrollment_id or booking_id is required" });
  }

  if (payment_method === "BANK_TRANSFER") {
    if (!reference_no || !String(reference_no).trim()) {
      return res.status(400).json({ message: "Reference number is required for bank transfer" });
    }

    if (!bank_slip_name || !String(bank_slip_name).trim()) {
      return res.status(400).json({ message: "Bank slip file name is required" });
    }

    if (!isValidSlipData(bank_slip_data)) {
      return res.status(400).json({ message: "Valid bank slip upload is required" });
    }

    if (String(bank_slip_data).length > 8 * 1024 * 1024) {
      return res.status(400).json({ message: "Bank slip file is too large" });
    }
  }

  try {
    await ensurePaymentsTableShape();
    await db.query("START TRANSACTION");

    let amount = null;
    const enrollmentId = enrollment_id ? Number(enrollment_id) : null;
    const bookingId = booking_id ? Number(booking_id) : null;

    if (enrollmentId) {
      const [rows] = await db.query(
        `SELECT
           e.id,
           e.status,
           cl.fee
         FROM enrollments e
         JOIN children ch ON ch.id = e.child_id
         JOIN classes cl ON cl.id = e.class_id
         WHERE e.id = ?
           AND (ch.parent_user_id = ? OR ch.parent_id = ?)
         FOR UPDATE`,
        [enrollmentId, parentId, parentId]
      );

      if (!rows.length) {
        await db.query("ROLLBACK");
        return res.status(403).json({ message: "Invalid enrollment" });
      }

      amount = Number(rows[0].fee || 0);

      if (amount <= 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ message: "Class fee is not set" });
      }

      const [paidAlready] = await db.query(
        `SELECT id
         FROM payments
         WHERE parent_user_id = ?
           AND enrollment_id = ?
           AND payment_status IN ('PAID', 'SUCCESS')
         LIMIT 1`,
        [parentId, enrollmentId]
      );

      if (paidAlready.length) {
        await db.query("ROLLBACK");
        return res.status(409).json({ message: "This enrollment is already paid" });
      }
    }

    if (bookingId) {
      const [bookingRows] = await db.query(
        `SELECT id
         FROM bookings
         WHERE id = ?
           AND (user_id = ? OR parent_user_id = ?)
         FOR UPDATE`,
        [bookingId, parentId, parentId]
      );

      if (!bookingRows.length) {
        await db.query("ROLLBACK");
        return res.status(403).json({ message: "Invalid booking" });
      }

      if (amount === null) {
        amount = 2500;
      }
    }

    const status = payment_method === "CARD" ? "PAID" : "PENDING";

    const [ins] = await db.query(
      `INSERT INTO payments
       (
         parent_user_id,
         enrollment_id,
         booking_id,
         amount,
         payment_method,
         payment_status,
         reference_no,
         notes,
         bank_slip_name,
         bank_slip_data
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parentId,
        enrollmentId,
        bookingId,
        amount,
        payment_method,
        status,
        reference_no || null,
        notes || null,
        payment_method === "BANK_TRANSFER" ? bank_slip_name.trim() : null,
        payment_method === "BANK_TRANSFER" ? bank_slip_data : null,
      ]
    );

    const paymentId = ins.insertId;
    const paymentNo = makePaymentNo(paymentId);

    await db.query(`UPDATE payments SET payment_no = ? WHERE id = ?`, [paymentNo, paymentId]);

    if (payment_method === "CARD" && enrollmentId) {
      await db.query(`UPDATE enrollments SET status = 'ACTIVE' WHERE id = ?`, [enrollmentId]);
    }

    await db.query("COMMIT");

    return res.status(201).json({
      message:
        payment_method === "BANK_TRANSFER"
          ? "Bank transfer submitted successfully and waiting for approval"
          : "Payment recorded",
      payment: {
        id: paymentId,
        payment_no: paymentNo,
        amount,
        payment_method,
        payment_status: status,
      },
    });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch (_) {}

    console.error("createPayment error:", err);
    return res.status(500).json({
      message: "Failed to create payment",
      error: err.message,
    });
  }
};