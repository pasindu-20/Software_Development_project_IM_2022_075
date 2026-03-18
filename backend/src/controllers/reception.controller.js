const db = require("../config/db");

async function tableExists(tableName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [tableName, columnName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function ensureReceptionShape() {
  if (await tableExists("bookings")) {
    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN walk_in_customer_name VARCHAR(150) NULL AFTER parent_user_id`
      );
    } catch (err) {}

    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN walk_in_phone VARCHAR(50) NULL AFTER walk_in_customer_name`
      );
    } catch (err) {}

    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN created_by INT NULL AFTER notes`
      );
    } catch (err) {}
  }

  if (await tableExists("payments")) {
    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN confirmed_by INT NULL AFTER notes`
      );
    } catch (err) {}

    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by`
      );
    } catch (err) {}
  }
}

exports.dashboardSummary = async (req, res) => {
  try {
    await ensureReceptionShape();

    let totalBookings = 0;
    let pendingBookings = 0;
    let pendingCashPayments = 0;
    let totalInquiries = 0;
    let pendingEnrollments = 0;

    if (await tableExists("bookings")) {
      const [[bookingStats]] = await db.query(`
        SELECT
          COUNT(*) AS totalBookings,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pendingBookings
        FROM bookings
      `);

      totalBookings = Number(bookingStats?.totalBookings || 0);
      pendingBookings = Number(bookingStats?.pendingBookings || 0);
    }

    if (await tableExists("payments")) {
      const [[paymentStats]] = await db.query(`
        SELECT COUNT(*) AS pendingCashPayments
        FROM payments
        WHERE payment_method = 'CASH' AND payment_status = 'PENDING'
      `);

      pendingCashPayments = Number(paymentStats?.pendingCashPayments || 0);
    }

    if (await tableExists("customer_inquiries")) {
      const [[inquiryStats]] = await db.query(`
        SELECT COUNT(*) AS totalInquiries
        FROM customer_inquiries
        WHERE status IN ('NEW', 'CONTACTED', 'FOLLOW_UP')
      `);

      totalInquiries = Number(inquiryStats?.totalInquiries || 0);
    }

    if (await tableExists("enrollments")) {
      const [[enrollmentStats]] = await db.query(`
        SELECT COUNT(*) AS pendingEnrollments
        FROM enrollments
        WHERE status = 'PENDING'
      `);

      pendingEnrollments = Number(enrollmentStats?.pendingEnrollments || 0);
    }

    res.json({
      totalBookings,
      pendingBookings,
      pendingCashPayments,
      totalInquiries,
      pendingEnrollments,
    });
  } catch (err) {
    console.error("dashboardSummary error:", err);
    res.status(500).json({ message: "Failed to load receptionist dashboard" });
  }
};

exports.listBookings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.booking_type,
        b.booking_date,
        b.time_slot,
        b.status,
        b.notes,
        b.created_at,
        COALESCE(u.full_name, b.walk_in_customer_name) AS customer_name,
        COALESCE(u.phone, b.walk_in_phone) AS customer_phone
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY b.created_at DESC, b.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listBookings error:", err);
    res.status(500).json({
      message: err?.sqlMessage || "Failed to load bookings",
    });
  }
};

exports.createManualBooking = async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      booking_type,
      booking_date,
      time_slot = null,
      note = null,
    } = req.body;

    if (!customer_name || !phone || !booking_type || !booking_date) {
      return res.status(400).json({
        message: "customer_name, phone, booking_type, and booking_date are required",
      });
    }

    const allowedTypes = ["PLAY_AREA", "PARTY", "EVENT", "CLASS"];
    if (!allowedTypes.includes(booking_type)) {
      return res.status(400).json({ message: "Invalid booking_type" });
    }

    const [result] = await db.query(
      `
      INSERT INTO bookings
      (user_id, walk_in_customer_name, walk_in_phone, booking_type, booking_date, time_slot, notes, created_by, status)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `,
      [
        customer_name,
        phone,
        booking_type,
        booking_date,
        time_slot,
        note,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Manual booking created successfully",
      booking_id: result.insertId,
    });
  } catch (err) {
    console.error("createManualBooking error:", err);
    res.status(500).json({
      message: err?.sqlMessage || "Failed to create manual booking",
    });
  }
};

exports.listCashPayments = async (req, res) => {
  try {
    await ensureReceptionShape();

    const [rows] = await db.query(`
      SELECT
        p.id,
        p.payment_no,
        p.amount,
        p.payment_method,
        p.payment_status AS status,
        p.reference_no,
        p.notes,
        p.created_at,
        p.booking_id,
        p.enrollment_id,
        COALESCE(parent_user.full_name, walkin_booking.walk_in_customer_name, guardian.full_name) AS customer_name
      FROM payments p
      LEFT JOIN users parent_user ON parent_user.id = p.parent_user_id
      LEFT JOIN bookings walkin_booking ON walkin_booking.id = p.booking_id
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN children c ON c.id = e.child_id
      LEFT JOIN users guardian ON guardian.id = c.parent_id
      WHERE p.payment_method = 'CASH' AND p.payment_status = 'PENDING'
      ORDER BY p.created_at DESC, p.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listCashPayments error:", err);
    res.status(500).json({ message: "Failed to load cash payments" });
  }
};

exports.confirmCashPayment = async (req, res) => {
  try {
    await ensureReceptionShape();

    const paymentId = Number(req.params.id);
    const { note = null } = req.body;

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: "Valid payment id is required" });
    }

    await db.query("START TRANSACTION");

    const [payments] = await db.query(
      `
      SELECT id, payment_method, payment_status, enrollment_id
      FROM payments
      WHERE id = ?
      FOR UPDATE
      `,
      [paymentId]
    );

    if (!payments.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = payments[0];

    if (payment.payment_method !== "CASH") {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Only CASH payments can be confirmed here" });
    }

    if (payment.payment_status === "PAID") {
      await db.query("ROLLBACK");
      return res.status(409).json({ message: "Payment is already confirmed" });
    }

    const hasConfirmedBy = await columnExists("payments", "confirmed_by");
    const hasConfirmedAt = await columnExists("payments", "confirmed_at");

    let updateSql = `UPDATE payments SET payment_status='PAID'`;
    const params = [];

    if (note) {
      updateSql += `, notes = CONCAT(COALESCE(notes, ''), CASE WHEN notes IS NULL OR notes='' THEN '' ELSE '\n' END, ?)`;
      params.push(note);
    }

    if (hasConfirmedBy) {
      updateSql += `, confirmed_by = ?`;
      params.push(req.user.id);
    }

    if (hasConfirmedAt) {
      updateSql += `, confirmed_at = NOW()`;
    }

    updateSql += ` WHERE id = ?`;
    params.push(paymentId);

    await db.query(updateSql, params);

    if (payment.enrollment_id) {
      await db.query(
        `UPDATE enrollments SET status='ACTIVE' WHERE id=?`,
        [payment.enrollment_id]
      );
    }

    await db.query("COMMIT");

    res.json({ message: "Cash payment confirmed successfully" });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch {}
    console.error("confirmCashPayment error:", err);
    res.status(500).json({ message: "Failed to confirm cash payment" });
  }
};

exports.listEnrollments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.child_id,
        e.class_id,
        e.status,
        e.enrolled_at,
        c.full_name AS child_name,
        parent_user.full_name AS guardian_name,
        parent_user.phone AS guardian_phone,
        cl.title AS class_title
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN users parent_user ON parent_user.id = c.parent_id
      JOIN classes cl ON cl.id = e.class_id
      ORDER BY e.enrolled_at DESC, e.id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("listEnrollments error:", err);
    res.status(500).json({ message: "Failed to load enrollments" });
  }
};

exports.createEnrollment = async (req, res) => {
  try {
    const { child_id, class_id } = req.body;

    if (!child_id || !class_id) {
      return res.status(400).json({ message: "child_id and class_id are required" });
    }

    const [childRows] = await db.query(
      `SELECT id, full_name FROM children WHERE id=?`,
      [Number(child_id)]
    );
    if (!childRows.length) {
      return res.status(404).json({ message: "Child not found" });
    }

    const [classRows] = await db.query(
      `SELECT id, title, item_type, status FROM classes WHERE id=?`,
      [Number(class_id)]
    );
    if (!classRows.length) {
      return res.status(404).json({ message: "Class not found" });
    }

    const cls = classRows[0];
    if (cls.status !== "ACTIVE") {
      return res.status(400).json({ message: "Selected class is not active" });
    }
    if (cls.item_type !== "CLASS") {
      return res.status(400).json({ message: "Only CLASS items can be used for enrollment" });
    }

    const [existing] = await db.query(
      `SELECT id FROM enrollments WHERE child_id=? AND class_id=? LIMIT 1`,
      [Number(child_id), Number(class_id)]
    );
    if (existing.length) {
      return res.status(409).json({ message: "This child is already enrolled in the selected class" });
    }

    const [result] = await db.query(
      `INSERT INTO enrollments (child_id, class_id, status) VALUES (?, ?, 'PENDING')`,
      [Number(child_id), Number(class_id)]
    );

    res.status(201).json({
      message: "Enrollment created successfully",
      enrollment_id: result.insertId,
    });
  } catch (err) {
    console.error("createEnrollment error:", err);
    res.status(500).json({ message: "Failed to create enrollment" });
  }
};

function makePaymentNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

exports.getBookingPaymentDetails = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Valid booking id is required" });
    }

    const [bookings] = await db.query(
      `
      SELECT
        b.id,
        b.booking_type,
        b.booking_date,
        b.time_slot,
        b.status,
        b.notes,
        b.created_at,
        COALESCE(u.full_name, b.walk_in_customer_name) AS customer_name,
        COALESCE(u.phone, b.walk_in_phone) AS customer_phone
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.id = ?
      LIMIT 1
      `,
      [bookingId]
    );

    if (!bookings.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookings[0];

    const hasBookingId = await columnExists("payments", "booking_id");
    if (!hasBookingId) {
      return res.status(500).json({
        message: "payments table is missing booking_id column",
      });
    }

    const [payments] = await db.query(
      `
      SELECT
        id,
        payment_no,
        amount,
        payment_method,
        payment_status,
        transaction_ref,
        paid_at,
        updated_at
      FROM payments
      WHERE booking_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [bookingId]
    );

    res.json({
      booking,
      payment: payments[0] || null,
    });
  } catch (err) {
    console.error("getBookingPaymentDetails error:", err);
    res.status(500).json({
      message: err?.sqlMessage || "Failed to load booking payment details",
    });
  }
};

exports.saveBookingPayment = async (req, res) => {
  try {
    const bookingId = Number(req.params.bookingId);
    const {
      amount,
      payment_method = "CASH",
      payment_status = "SUCCESS",
      transaction_ref = null,
    } = req.body;

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Valid booking id is required" });
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const allowedMethods = ["CASH", "CARD", "ONLINE"];
    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const allowedStatuses = ["PENDING", "SUCCESS", "FAILED"];
    if (!allowedStatuses.includes(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const hasBookingId = await columnExists("payments", "booking_id");
    if (!hasBookingId) {
      return res.status(500).json({
        message: "payments table is missing booking_id column",
      });
    }

    const [bookings] = await db.query(
      `SELECT id FROM bookings WHERE id = ? LIMIT 1`,
      [bookingId]
    );

    if (!bookings.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const [existing] = await db.query(
      `
      SELECT id
      FROM payments
      WHERE booking_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [bookingId]
    );

    if (existing.length) {
      await db.query(
        `
        UPDATE payments
        SET
          amount = ?,
          payment_method = ?,
          payment_status = ?,
          transaction_ref = ?,
          paid_at = CASE WHEN ? = 'SUCCESS' THEN NOW() ELSE paid_at END
        WHERE id = ?
        `,
        [
          parsedAmount,
          payment_method,
          payment_status,
          transaction_ref,
          payment_status,
          existing[0].id,
        ]
      );
    } else {
      await db.query(
        `
        INSERT INTO payments
        (payment_no, enrollment_id, booking_id, amount, payment_method, payment_status, transaction_ref, paid_at)
        VALUES (?, NULL, ?, ?, ?, ?, ?, CASE WHEN ? = 'SUCCESS' THEN NOW() ELSE NULL END)
        `,
        [
          makePaymentNo(),
          bookingId,
          parsedAmount,
          payment_method,
          payment_status,
          transaction_ref,
          payment_status,
        ]
      );
    }

    if (payment_status === "SUCCESS") {
      await db.query(
        `UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?`,
        [bookingId]
      );
    }

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error("saveBookingPayment error:", err);
    res.status(500).json({
      message: err?.sqlMessage || "Failed to update payment",
    });
  }
};