const db = require("../config/db");

// GET /api/parent/me
exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone FROM users WHERE id=?",
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// GET /api/parent/classes
exports.listClasses = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, description, age_min, age_max, fee FROM classes WHERE status='ACTIVE' ORDER BY id DESC"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to load classes" });
  }
};

// POST /api/parent/children
exports.addChild = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { child_name, dob, notes } = req.body;

    if (!child_name) return res.status(400).json({ message: "child_name is required" });

    await db.query(
      "INSERT INTO children (parent_user_id, child_name, dob, notes) VALUES (?, ?, ?, ?)",
      [parentId, child_name, dob || null, notes || null]
    );

    res.status(201).json({ message: "Child added" });
  } catch (e) {
    res.status(500).json({ message: "Failed to add child" });
  }
};

// GET /api/parent/children
exports.listChildren = async (req, res) => {
  try {
    const parentId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, child_name, dob, notes, created_at FROM children WHERE parent_user_id=? ORDER BY created_at DESC",
      [parentId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to load children" });
  }
};

// POST /api/parent/enroll
exports.enroll = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { child_id, class_id } = req.body;

    if (!child_id || !class_id) {
      return res.status(400).json({ message: "child_id and class_id are required" });
    }

    // verify child belongs to parent
    const [kids] = await db.query(
      "SELECT id FROM children WHERE id=? AND parent_user_id=?",
      [child_id, parentId]
    );
    if (!kids.length) return res.status(403).json({ message: "Invalid child" });

    // create enrollment
    await db.query(
      "INSERT INTO enrollments (child_id, class_id, status) VALUES (?, ?, 'PENDING')",
      [child_id, class_id]
    );

    res.status(201).json({ message: "Enrollment created (PENDING)" });
  } catch (e) {
    // duplicate enrollment
    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Child already enrolled in this class" });
    }
    res.status(500).json({ message: "Failed to enroll" });
  }
};

// GET /api/parent/enrollments
exports.myEnrollments = async (req, res) => {
  try {
    const parentId = req.user.id;

    const [rows] = await db.query(
      `SELECT e.id,
              c.child_name,
              cl.title AS class_title,
              e.status,
              e.enrolled_at
       FROM enrollments e
       JOIN children c ON c.id = e.child_id
       JOIN classes cl ON cl.id = e.class_id
       WHERE c.parent_user_id=?
       ORDER BY e.enrolled_at DESC`,
      [parentId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to load enrollments" });
  }
};

// GET /api/parent/payments
exports.myPayments = async (req, res) => {
  try {
    const parentId = req.user.id;

    const [rows] = await db.query(
      `SELECT p.id,
              p.amount,
              p.payment_method,
              p.payment_status,
              p.reference_no,
              p.created_at,
              cl.title AS class_title,
              ch.child_name
       FROM payments p
       LEFT JOIN enrollments e ON e.id = p.enrollment_id
       LEFT JOIN classes cl ON cl.id = e.class_id
       LEFT JOIN children ch ON ch.id = e.child_id
       WHERE p.parent_user_id=?
       ORDER BY p.created_at DESC`,
      [parentId]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Failed to load payments" });
  }
};
