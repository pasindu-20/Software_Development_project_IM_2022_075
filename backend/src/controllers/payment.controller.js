const db = require("../config/db");
const Stripe = require("stripe");

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing in backend .env");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

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
      transaction_ref VARCHAR(255) NULL,
      notes TEXT NULL,
      confirmed_by INT NULL,
      confirmed_at DATETIME NULL,
      bank_slip_name VARCHAR(255) NULL,
      bank_slip_data LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const alterStatements = [
    `ALTER TABLE payments ADD COLUMN payment_no VARCHAR(50) NULL AFTER id`,
    `ALTER TABLE payments ADD COLUMN parent_user_id INT NOT NULL AFTER payment_no`,
    `ALTER TABLE payments ADD COLUMN enrollment_id INT NULL AFTER parent_user_id`,
    `ALTER TABLE payments ADD COLUMN booking_id INT NULL AFTER enrollment_id`,
    `ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER booking_id`,
    `ALTER TABLE payments ADD COLUMN payment_method ENUM('CARD','CASH','BANK_TRANSFER') NOT NULL AFTER amount`,
    `ALTER TABLE payments ADD COLUMN payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING' AFTER payment_method`,
    `ALTER TABLE payments ADD COLUMN reference_no VARCHAR(100) NULL AFTER payment_status`,
    `ALTER TABLE payments ADD COLUMN transaction_ref VARCHAR(255) NULL AFTER reference_no`,
    `ALTER TABLE payments ADD COLUMN notes TEXT NULL AFTER transaction_ref`,
    `ALTER TABLE payments ADD COLUMN confirmed_by INT NULL AFTER notes`,
    `ALTER TABLE payments ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by`,
    `ALTER TABLE payments ADD COLUMN bank_slip_name VARCHAR(255) NULL AFTER confirmed_at`,
    `ALTER TABLE payments ADD COLUMN bank_slip_data LONGTEXT NULL AFTER bank_slip_name`,
    `ALTER TABLE payments ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    `ALTER TABLE payments MODIFY COLUMN payment_method ENUM('CARD','CASH','BANK_TRANSFER') NOT NULL`,
    `ALTER TABLE payments MODIFY COLUMN payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING'`,
  ];

  for (const sql of alterStatements) {
    try {
      await db.query(sql);
    } catch (_) { }
  }
}

function isValidSlipData(data) {
  if (!data || typeof data !== "string") return false;

  return (
    data.startsWith("data:image/") ||
    data.startsWith("data:application/pdf")
  );
}

function extractAmountFromText(text) {
  const value = String(text || "");
  const match = value.match(/LKR\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  if (!match) return null;

  const amount = Number(String(match[1]).replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return amount;
}

async function resolvePaymentContext({ parentId, enrollmentId, bookingId }) {
  let amount = null;
  let enrollment = null;
  let booking = null;

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
      throw Object.assign(new Error("Invalid enrollment"), { statusCode: 403 });
    }

    enrollment = rows[0];
    amount = Number(enrollment.fee || 0);

    if (amount <= 0) {
      throw Object.assign(new Error("Class fee is not set"), { statusCode: 400 });
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
      throw Object.assign(new Error("This enrollment is already paid"), { statusCode: 409 });
    }
  }

  if (bookingId) {
    const [bookingRows] = await db.query(
      `SELECT id, booking_type, notes
       FROM bookings
       WHERE id = ?
         AND user_id = ?
       FOR UPDATE`,
      [bookingId, parentId]
    );

    if (!bookingRows.length) {
      throw Object.assign(new Error("Invalid booking"), { statusCode: 403 });
    }

    booking = bookingRows[0];

    if (amount === null) {
      amount = extractAmountFromText(booking.notes);

      if (amount === null) {
        amount = 2500;
      }
    }

    const [paidBooking] = await db.query(
      `SELECT id
       FROM payments
       WHERE parent_user_id = ?
         AND booking_id = ?
         AND payment_status IN ('PAID', 'SUCCESS')
       LIMIT 1`,
      [parentId, bookingId]
    );

    if (paidBooking.length) {
      throw Object.assign(new Error("This booking is already paid"), { statusCode: 409 });
    }
  }

  return { amount, enrollment, booking };
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

  if (!payment_method || !["CASH", "BANK_TRANSFER"].includes(payment_method)) {
    return res.status(400).json({
      message: "Invalid payment_method. Use CASH or BANK_TRANSFER here. CARD payments must use Stripe.",
    });
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

    const enrollmentId = enrollment_id ? Number(enrollment_id) : null;
    const bookingId = booking_id ? Number(booking_id) : null;

    const { amount } = await resolvePaymentContext({
      parentId,
      enrollmentId,
      bookingId,
    });

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
         transaction_ref,
         notes,
         bank_slip_name,
         bank_slip_data
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parentId,
        enrollmentId,
        bookingId,
        amount,
        payment_method,
        "PENDING",
        reference_no || null,
        reference_no || null,
        notes || null,
        payment_method === "BANK_TRANSFER" ? bank_slip_name.trim() : null,
        payment_method === "BANK_TRANSFER" ? bank_slip_data : null,
      ]
    );

    const paymentId = ins.insertId;
    const paymentNo = makePaymentNo(paymentId);

    await db.query(`UPDATE payments SET payment_no = ? WHERE id = ?`, [paymentNo, paymentId]);
    await db.query("COMMIT");

    return res.status(201).json({
      message:
        payment_method === "BANK_TRANSFER"
          ? "Bank transfer submitted successfully and waiting for approval"
          : "Payment recorded as pending",
      payment: {
        id: paymentId,
        payment_no: paymentNo,
        amount,
        payment_method,
        payment_status: "PENDING",
      },
    });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch (_) { }

    console.error("createPayment error:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Failed to create payment",
    });
  }
};

exports.createStripePaymentIntent = async (req, res) => {
  const parentId = req.user.id;
  const { enrollment_id, booking_id } = req.body || {};

  if (!enrollment_id && !booking_id) {
    return res.status(400).json({ message: "enrollment_id or booking_id is required" });
  }

  try {
    await ensurePaymentsTableShape();
    await db.query("START TRANSACTION");

    const enrollmentId = enrollment_id ? Number(enrollment_id) : null;
    const bookingId = booking_id ? Number(booking_id) : null;

    const { amount } = await resolvePaymentContext({
      parentId,
      enrollmentId,
      bookingId,
    });

    await db.query("COMMIT");

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: "lkr",
      payment_method_types: ["card"],
      metadata: {
        parent_user_id: String(parentId),
        enrollment_id: enrollmentId ? String(enrollmentId) : "",
        booking_id: bookingId ? String(bookingId) : "",
      },
    });

    return res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: Number(amount),
      currency: "LKR",
    });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch (_) { }

    console.error("createStripePaymentIntent error:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Failed to create Stripe payment intent",
    });
  }
};

exports.finalizeStripePayment = async (req, res) => {
  const parentId = req.user.id;
  const { payment_intent_id, notes } = req.body || {};

  if (!payment_intent_id) {
    return res.status(400).json({ message: "payment_intent_id is required" });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!intent) {
      return res.status(404).json({ message: "PaymentIntent not found" });
    }

    if (intent.status !== "succeeded") {
      return res.status(400).json({
        message: `Payment is not completed yet. Current status: ${intent.status}`,
      });
    }

    const metadataParentId = Number(intent.metadata?.parent_user_id || 0);
    const enrollmentId = intent.metadata?.enrollment_id ? Number(intent.metadata.enrollment_id) : null;
    const bookingId = intent.metadata?.booking_id ? Number(intent.metadata.booking_id) : null;

    if (metadataParentId !== Number(parentId)) {
      return res.status(403).json({ message: "This payment does not belong to the logged in parent" });
    }

    await ensurePaymentsTableShape();
    await db.query("START TRANSACTION");

    const [existingByRef] = await db.query(
      `SELECT id, payment_no, amount, payment_method, payment_status
       FROM payments
       WHERE transaction_ref = ? OR reference_no = ?
       LIMIT 1`,
      [payment_intent_id, payment_intent_id]
    );

    if (existingByRef.length) {
      await db.query("COMMIT");
      return res.json({
        message: "Payment already recorded",
        payment: existingByRef[0],
      });
    }

    const { amount } = await resolvePaymentContext({
      parentId,
      enrollmentId,
      bookingId,
    });

    const paidAmount = Number(intent.amount_received || intent.amount || 0) / 100;

    if (Number(paidAmount.toFixed(2)) !== Number(Number(amount).toFixed(2))) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        message: "Paid amount does not match the system amount",
      });
    }

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
         transaction_ref,
         notes,
         confirmed_at
       )
       VALUES (?, ?, ?, ?, 'CARD', 'PAID', ?, ?, ?, NOW())`,
      [
        parentId,
        enrollmentId,
        bookingId,
        amount,
        payment_intent_id,
        payment_intent_id,
        notes || null,
      ]
    );

    const paymentId = ins.insertId;
    const paymentNo = makePaymentNo(paymentId);

    await db.query(`UPDATE payments SET payment_no = ? WHERE id = ?`, [paymentNo, paymentId]);

    if (enrollmentId) {
      await db.query(`UPDATE enrollments SET status = 'ACTIVE' WHERE id = ?`, [enrollmentId]);
    }

    await db.query("COMMIT");

    return res.status(201).json({
      message: "Stripe card payment successful",
      payment: {
        id: paymentId,
        payment_no: paymentNo,
        amount,
        payment_method: "CARD",
        payment_status: "PAID",
        reference_no: payment_intent_id,
      },
    });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch (_) { }

    console.error("finalizeStripePayment error:", err);
    return res.status(err.statusCode || 500).json({
      message: err.message || "Failed to finalize Stripe payment",
    });
  }
};