const db = require("../config/db");

function makePaymentNo(id) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `PAY-${y}${m}${day}-${String(id).padStart(6, "0")}`;
}

/**
 * POST /api/parent/payments
 * Body:
 *  - enrollment_id (optional)
 *  - booking_id (optional)
 *  - payment_method: "CARD" | "CASH" | "BANK_TRANSFER"
 *  - reference_no (optional, for bank transfer)
 *  - notes (optional)
 *
 * Rules:
 *  - Parent can only pay for their own enrollment/booking
 *  - If CARD: mark PAID immediately + set enrollment ACTIVE (ACID transaction)
 *  - If CASH/BANK_TRANSFER: create PENDING payment; enrollment stays PENDING (admin confirms later)
 */
exports.createPayment = async (req, res) => {
  const parentId = req.user.id;
  const { enrollment_id, booking_id, payment_method, reference_no, notes } = req.body;

  if (!payment_method || !["CARD", "CASH", "BANK_TRANSFER"].includes(payment_method)) {
    return res.status(400).json({ message: "Invalid payment_method" });
  }

  if (!enrollment_id && !booking_id) {
    return res.status(400).json({ message: "enrollment_id or booking_id is required" });
  }

  try {
    await db.query("START TRANSACTION");

    let amount = null;
    let enrollmentId = enrollment_id ? Number(enrollment_id) : null;
    let bookingId = booking_id ? Number(booking_id) : null;

    // ---- PAY FOR ENROLLMENT ----
    if (enrollmentId) {
      // Verify enrollment belongs to this parent + lock row
      const [rows] = await db.query(
        `SELECT e.id, e.status,
                cl.fee
         FROM enrollments e
         JOIN children ch ON ch.id = e.child_id
         JOIN classes cl ON cl.id = e.class_id
         WHERE e.id=? AND ch.parent_user_id=?
         FOR UPDATE`,
        [enrollmentId, parentId]
      );

      if (!rows.length) {
        await db.query("ROLLBACK");
        return res.status(403).json({ message: "Invalid enrollment" });
      }

      const enr = rows[0];
      amount = Number(enr.fee || 0);

      if (amount <= 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ message: "Class fee is not set" });
      }

      // Prevent double paid
      const [paidAlready] = await db.query(
        `SELECT id FROM payments
         WHERE parent_user_id=? AND enrollment_id=? AND payment_status='PAID'
         LIMIT 1`,
        [parentId, enrollmentId]
      );
      if (paidAlready.length) {
        await db.query("ROLLBACK");
        return res.status(409).json({ message: "This enrollment is already paid" });
      }
    }

    // ---- PAY FOR BOOKING (optional) ----
    // For now, keep amount fixed or later calculate from booking type/package table.
    if (bookingId) {
      const [b] = await db.query(
        `SELECT id FROM bookings WHERE id=? AND parent_user_id=? FOR UPDATE`,
        [bookingId, parentId]
      );
      if (!b.length) {
        await db.query("ROLLBACK");
        return res.status(403).json({ message: "Invalid booking" });
      }

      // TEMP: booking payment amount (later you can link packages/pricing)
      if (amount === null) amount = 2500; // default booking payment for now
    }

    // Decide initial status
    const status = payment_method === "CARD" ? "PAID" : "PENDING";

    // Create payment row
    const [ins] = await db.query(
      `INSERT INTO payments
       (parent_user_id, enrollment_id, booking_id, amount, payment_method, payment_status, reference_no, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parentId,
        enrollmentId,
        bookingId,
        amount,
        payment_method,
        status,
        reference_no || null,
        notes || null,
      ]
    );

    const paymentId = ins.insertId;
    const paymentNo = makePaymentNo(paymentId);

    await db.query("UPDATE payments SET payment_no=? WHERE id=?", [paymentNo, paymentId]);

    // If CARD, activate enrollment immediately
    if (payment_method === "CARD" && enrollmentId) {
      await db.query("UPDATE enrollments SET status='ACTIVE' WHERE id=?", [enrollmentId]);
    }

    await db.query("COMMIT");

    return res.status(201).json({
      message: "Payment recorded",
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
    } catch {}
    console.error("createPayment error:", err);
    return res.status(500).json({ message: "Failed to create payment" });
  }
};
