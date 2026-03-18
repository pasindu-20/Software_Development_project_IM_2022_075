const express = require("express");
const router = express.Router();

const instructorController = require("../controllers/instructor.controller");
const authenticate = require("../middlewares/authenticate");

router.get("/dashboard", authenticate, instructorController.dashboardSummary);
router.get("/classes", authenticate, instructorController.listAssignedClasses);
router.get("/classes/:classId/children", authenticate, instructorController.listEnrolledChildren);
router.post("/classes/:classId/attendance", authenticate, instructorController.markAttendance);
router.get("/classes/:classId/attendance", authenticate, instructorController.getAttendanceRecords);

module.exports = router;