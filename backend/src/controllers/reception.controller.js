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

async function getEnumValues(tableName, columnName) {
  const [rows] = await db.query(
    `
    SELECT COLUMN_TYPE
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );

  if (!rows.length || !rows[0].COLUMN_TYPE) return [];

  const columnType = rows[0].COLUMN_TYPE;
  const matches = [...columnType.matchAll(/'([^']+)'/g)];
  return matches.map((m) => m[1]);
}

async function resolvePaidStatusValue() {
  const values = await getEnumValues("payments", "payment_status");

  if (values.includes("PAID")) return "PAID";
  if (values.includes("SUCCESS")) return "SUCCESS";

  const fallback = values.find((v) =>
    ["PAID", "SUCCESS", "COMPLETED", "CONFIRMED"].includes(v)
  );

  return fallback || "PAID";
}

async function resolveSuccessStatusValue() {
  const values = await getEnumValues("payments", "payment_status");

  if (values.includes("SUCCESS")) return "SUCCESS";
  if (values.includes("PAID")) return "PAID";

  const fallback = values.find((v) =>
    ["SUCCESS", "PAID", "COMPLETED", "CONFIRMED"].includes(v)
  );

  return fallback || "SUCCESS";
}

async function ensureReceptionShape() {
  if (await tableExists("bookings")) {
    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN walk_in_customer_name VARCHAR(150) NULL AFTER user_id`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN walk_in_phone VARCHAR(50) NULL AFTER walk_in_customer_name`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE bookings ADD COLUMN created_by INT NULL AFTER notes`
      );
    } catch (err) { }
  }

  if (await tableExists("payments")) {
    try {
      await db.query(
        `ALTER TABLE payments
         MODIFY COLUMN payment_status ENUM('PENDING','PAID','SUCCESS','FAILED','CANCELLED')
         NOT NULL DEFAULT 'PENDING'`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN confirmed_by INT NULL AFTER notes`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN confirmed_at DATETIME NULL AFTER confirmed_by`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN bank_slip_name VARCHAR(255) NULL AFTER confirmed_at`
      );
    } catch (err) { }

    try {
      await db.query(
        `ALTER TABLE payments ADD COLUMN bank_slip_data LONGTEXT NULL AFTER bank_slip_name`
      );
    } catch (err) { }
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

        CASE
          WHEN p.enrollment_id IS NOT NULL THEN 'ENROLLMENT'
          WHEN p.booking_id IS NOT NULL THEN 'BOOKING'
          ELSE 'OTHER'
        END AS payment_for,

        COALESCE(parent_user.full_name, walkin_booking.walk_in_customer_name, guardian.full_name) AS customer_name,
        COALESCE(parent_user.phone, walkin_booking.walk_in_phone, guardian.phone) AS customer_phone,

        walkin_booking.booking_type,
        walkin_booking.booking_date,
        walkin_booking.time_slot,

        c.full_name AS child_name,
        cl.title AS class_title,
        e.status AS enrollment_status
      FROM payments p
      LEFT JOIN users parent_user ON parent_user.id = p.parent_user_id
      LEFT JOIN bookings walkin_booking ON walkin_booking.id = p.booking_id
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN children c ON c.id = e.child_id
      LEFT JOIN classes cl ON cl.id = e.class_id
      LEFT JOIN users guardian ON guardian.id = c.parent_id
      WHERE p.payment_method = 'CASH'
        AND p.payment_status = 'PENDING'
      ORDER BY p.created_at DESC, p.id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        amount: Number(row.amount || 0),
      }))
    );
  } catch (err) {
    console.error("listCashPayments error:", err);
    res.status(500).json({ message: "Failed to load cash payments" });
  }
};

exports.confirmCashPayment = async (req, res) => {
  try {
    await ensureReceptionShape();

    const paymentId = Number(req.params.id);
    const paidStatusValue = await resolvePaidStatusValue();

    let noteText = null;
    if (typeof req.body?.note === "string") {
      noteText = req.body.note.trim() || null;
    } else if (typeof req.body?.notes === "string") {
      noteText = req.body.notes.trim() || null;
    }

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: "Valid payment id is required" });
    }

    await db.query("START TRANSACTION");

    const [payments] = await db.query(
      `
      SELECT id, payment_method, payment_status, enrollment_id, booking_id
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

    if (payment.payment_status === paidStatusValue) {
      await db.query("ROLLBACK");
      return res.status(409).json({ message: "Payment is already confirmed" });
    }

    const hasConfirmedBy = await columnExists("payments", "confirmed_by");
    const hasConfirmedAt = await columnExists("payments", "confirmed_at");

    let updateSql = `UPDATE payments SET payment_status = ?`;
    const params = [paidStatusValue];

    if (noteText) {
      updateSql += `
        , notes = CONCAT(
            COALESCE(notes, ''),
            CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\\n' END,
            ?
          )
      `;
      params.push(noteText);
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
        `UPDATE enrollments SET status = 'ACTIVE' WHERE id = ?`,
        [payment.enrollment_id]
      );
    }

    if (payment.booking_id) {
      await db.query(
        `UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?`,
        [payment.booking_id]
      );
    }

    await db.query("COMMIT");

    res.json({ message: "Cash payment confirmed successfully" });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch { }
    console.error("confirmCashPayment error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to confirm cash payment" });
  }
};

exports.listBankTransferPayments = async (req, res) => {
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
        p.bank_slip_name,
        p.bank_slip_data,

        CASE
          WHEN p.enrollment_id IS NOT NULL THEN 'ENROLLMENT'
          WHEN p.booking_id IS NOT NULL THEN 'BOOKING'
          ELSE 'OTHER'
        END AS payment_for,

        COALESCE(parent_user.full_name, walkin_booking.walk_in_customer_name, guardian.full_name) AS customer_name,
        COALESCE(parent_user.phone, walkin_booking.walk_in_phone, guardian.phone) AS customer_phone,

        walkin_booking.booking_type,
        walkin_booking.booking_date,
        walkin_booking.time_slot,

        c.full_name AS child_name,
        cl.title AS class_title,
        e.status AS enrollment_status
      FROM payments p
      LEFT JOIN users parent_user ON parent_user.id = p.parent_user_id
      LEFT JOIN bookings walkin_booking ON walkin_booking.id = p.booking_id
      LEFT JOIN enrollments e ON e.id = p.enrollment_id
      LEFT JOIN children c ON c.id = e.child_id
      LEFT JOIN classes cl ON cl.id = e.class_id
      LEFT JOIN users guardian ON guardian.id = c.parent_id
      WHERE p.payment_method = 'BANK_TRANSFER'
        AND p.payment_status = 'PENDING'
      ORDER BY p.created_at DESC, p.id DESC
    `);

    res.json(
      rows.map((row) => ({
        ...row,
        amount: Number(row.amount || 0),
      }))
    );
  } catch (err) {
    console.error("listBankTransferPayments error:", err);
    res.status(500).json({ message: "Failed to load bank transfer payments" });
  }
};

exports.confirmBankTransferPayment = async (req, res) => {
  try {
    await ensureReceptionShape();

    const paymentId = Number(req.params.id);
    const successStatusValue = await resolveSuccessStatusValue();

    let noteText = null;
    if (typeof req.body?.note === "string") {
      noteText = req.body.note.trim() || null;
    } else if (typeof req.body?.notes === "string") {
      noteText = req.body.notes.trim() || null;
    }

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: "Valid payment id is required" });
    }

    await db.query("START TRANSACTION");

    const [payments] = await db.query(
      `
      SELECT id, payment_method, payment_status, enrollment_id, booking_id
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

    if (payment.payment_method !== "BANK_TRANSFER") {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "Only BANK_TRANSFER payments can be approved here" });
    }

    if (payment.payment_status === successStatusValue) {
      await db.query("ROLLBACK");
      return res.status(409).json({ message: "Payment is already approved" });
    }

    const hasConfirmedBy = await columnExists("payments", "confirmed_by");
    const hasConfirmedAt = await columnExists("payments", "confirmed_at");

    let updateSql = `UPDATE payments SET payment_status = ?`;
    const params = [successStatusValue];

    if (noteText) {
      updateSql += `
        , notes = CONCAT(
            COALESCE(notes, ''),
            CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '\\n' END,
            ?
          )
      `;
      params.push(noteText);
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
        `UPDATE enrollments SET status = 'ACTIVE' WHERE id = ?`,
        [payment.enrollment_id]
      );
    }

    if (payment.booking_id) {
      await db.query(
        `UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?`,
        [payment.booking_id]
      );
    }

    await db.query("COMMIT");

    res.json({ message: "Bank transfer approved successfully" });
  } catch (err) {
    try {
      await db.query("ROLLBACK");
    } catch { }
    console.error("confirmBankTransferPayment error:", err);
    res.status(500).json({ message: err?.sqlMessage || "Failed to approve bank transfer payment" });
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
        e.created_at,
        c.full_name AS child_name,
        parent_user.full_name AS guardian_name,
        parent_user.phone AS guardian_phone,
        cl.title AS class_title
      FROM enrollments e
      JOIN children c ON c.id = e.child_id
      JOIN users parent_user ON parent_user.id = c.parent_id
      JOIN classes cl ON cl.id = e.class_id
      ORDER BY e.created_at DESC, e.id DESC
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
      `SELECT id, full_name FROM children WHERE id = ?`,
      [Number(child_id)]
    );
    if (!childRows.length) {
      return res.status(404).json({ message: "Child not found" });
    }

    const [classRows] = await db.query(
      `SELECT id, title, item_type, status FROM classes WHERE id = ?`,
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
      `SELECT id FROM enrollments WHERE child_id = ? AND class_id = ? LIMIT 1`,
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

    const hasTransactionRef = await columnExists("payments", "transaction_ref");
    const referenceField = hasTransactionRef ? "transaction_ref" : "reference_no";

    const [payments] = await db.query(
      `
      SELECT
        id,
        payment_no,
        amount,
        payment_method,
        payment_status,
        ${referenceField} AS transaction_ref,
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
      payment_status = null,
      transaction_ref = null,
    } = req.body;

    const paidStatusValue = await resolvePaidStatusValue();

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ message: "Valid booking id is required" });
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER"];
    if (!allowedMethods.includes(payment_method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const statusEnumValues = await getEnumValues("payments", "payment_status");
    const finalPaymentStatus =
      payment_status && statusEnumValues.includes(payment_status)
        ? payment_status
        : paidStatusValue;

    const hasBookingId = await columnExists("payments", "booking_id");
    if (!hasBookingId) {
      return res.status(500).json({
        message: "payments table is missing booking_id column",
      });
    }

    const hasTransactionRef = await columnExists("payments", "transaction_ref");
    const refColumn = hasTransactionRef ? "transaction_ref" : "reference_no";

    const [bookings] = await db.query(
      `
      SELECT
        id,
        user_id,
        walk_in_customer_name,
        walk_in_phone
      FROM bookings
      WHERE id = ?
      LIMIT 1
      `,
      [bookingId]
    );

    if (!bookings.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookings[0];
    const parentUserId = booking.user_id || req.user.id;

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
          parent_user_id = ?,
          amount = ?,
          payment_method = ?,
          payment_status = ?,
          ${refColumn} = ?,
          paid_at = CASE WHEN ? = ? THEN NOW() ELSE paid_at END,
          updated_at = NOW()
        WHERE id = ?
        `,
        [
          parentUserId,
          parsedAmount,
          payment_method,
          finalPaymentStatus,
          transaction_ref,
          finalPaymentStatus,
          paidStatusValue,
          existing[0].id,
        ]
      );
    } else {
      await db.query(
        `
        INSERT INTO payments
        (
          payment_no,
          parent_user_id,
          enrollment_id,
          booking_id,
          amount,
          payment_method,
          payment_status,
          ${refColumn},
          paid_at
        )
        VALUES
        (
          ?,
          ?,
          NULL,
          ?,
          ?,
          ?,
          ?,
          ?,
          CASE WHEN ? = ? THEN NOW() ELSE NULL END
        )
        `,
        [
          makePaymentNo(),
          parentUserId,
          bookingId,
          parsedAmount,
          payment_method,
          finalPaymentStatus,
          transaction_ref,
          finalPaymentStatus,
          paidStatusValue,
        ]
      );
    }

    if (["PAID", "SUCCESS"].includes(String(finalPaymentStatus || "").toUpperCase())) {
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