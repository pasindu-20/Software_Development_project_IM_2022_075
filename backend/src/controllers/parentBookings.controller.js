const db = require("../config/db");

function convert12HourToMinutes(time12h) {
  const value = String(time12h || "").trim();
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return hour * 60 + minute;
}

function parseTimeSlotToRange(timeSlot) {
  const parts = String(timeSlot || "").split(" - ");
  if (parts.length !== 2) return null;

  const startMinutes = convert12HourToMinutes(parts[0]);
  const endMinutes = convert12HourToMinutes(parts[1]);

  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;

  return { startMinutes, endMinutes };
}

function isTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { booking_type, booking_date, time_slot, notes } = req.body;

    if (!booking_type || !booking_date || !time_slot) {
      return res.status(400).json({
        message: "booking_type, booking_date and time_slot are required",
      });
    }

    const allowedTypes = ["PLAY_AREA", "PARTY", "CLASS", "EVENT"];
    if (!allowedTypes.includes(booking_type)) {
      return res.status(400).json({
        message: "Invalid booking type",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(booking_date);
    selectedDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        message: "Invalid booking date",
      });
    }

    if (selectedDate < today) {
      return res.status(400).json({
        message: "Past dates cannot be selected",
      });
    }

    const trimmedTimeSlot = String(time_slot).trim();
    if (!trimmedTimeSlot) {
      return res.status(400).json({
        message: "Time slot is required",
      });
    }

    const requestedRange = parseTimeSlotToRange(trimmedTimeSlot);
    if (!requestedRange) {
      return res.status(400).json({
        message: "Invalid time slot format",
      });
    }

    // Block overlapping PARTY bookings only
    if (booking_type === "PARTY") {
      const [existingBookings] = await db.query(
        `SELECT id, time_slot
         FROM bookings
         WHERE booking_type = 'PARTY'
           AND booking_date = ?
           AND status IN ('PENDING', 'CONFIRMED')`,
        [booking_date]
      );

      const hasOverlap = existingBookings.some((booking) => {
        const existingRange = parseTimeSlotToRange(booking.time_slot);
        if (!existingRange) return false;

        return isTimeOverlap(
          requestedRange.startMinutes,
          requestedRange.endMinutes,
          existingRange.startMinutes,
          existingRange.endMinutes
        );
      });

      if (hasOverlap) {
        return res.status(409).json({
          message: "This party time slot is already booked. Please select another time.",
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO bookings (user_id, booking_type, booking_date, time_slot, notes, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [userId, booking_type, booking_date, trimmedTimeSlot, notes || null]
    );

    return res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId,
    });
  } catch (err) {
    console.error("createBooking error:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  }
};

// Get my bookings
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT *
       FROM bookings
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// Get single booking
exports.getMyBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT *
       FROM bookings
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("getMyBookingById error:", err);
    return res.status(500).json({ message: "Failed to fetch booking" });
  }
};

// Cancel booking
exports.cancelMyBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT id, status
       FROM bookings
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await db.query(
      `UPDATE bookings
       SET status = 'CANCELLED'
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("cancelMyBooking error:", err);
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
};