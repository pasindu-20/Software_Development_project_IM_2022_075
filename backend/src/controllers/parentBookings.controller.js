const db = require("../config/db");

// POST /api/parent/bookings
exports.createBooking = async (req, res) => {
  try {
    const parentId = req.user.id; // from JWT
    const { booking_type, booking_date, time_slot, notes } = req.body;

    if (!booking_type || !booking_date || !time_slot) {
      return res.status(400).json({ message: "booking_type, booking_date, time_slot are required" });
    }

    // basic sanity checks
    const allowed = ["PLAY_AREA", "PARTY", "CLASS_TRIAL", "OTHER"];
    if (!allowed.includes(booking_type)) {
      return res.status(400).json({ message: "Invalid booking_type" });
    }

    await db.query(
      `INSERT INTO bookings (parent_user_id, booking_type, booking_date, time_slot, notes, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [parentId, booking_type, booking_date, time_slot, notes || null]
    );

    return res.status(201).json({ message: "Booking created successfully" });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  }
};

// GET /api/parent/bookings
exports.getMyBookings = async (req, res) => {
  try {
    const parentId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, booking_type, booking_date, time_slot, notes, status, created_at
       FROM bookings
       WHERE parent_user_id=?
       ORDER BY created_at DESC`,
      [parentId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Failed to load bookings" });
  }
};
