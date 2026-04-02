const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const instructorController = require("../controllers/instructor.controller");

router.get(
  "/dashboard",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  instructorController.dashboardSummary
);

router.get(
  "/classes",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  instructorController.listAssignedClasses
);

router.get(
  "/classes/:classId/children",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  instructorController.listEnrolledChildren
);

router.post(
  "/classes/:classId/attendance",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  instructorController.markAttendance
);

router.get(
  "/classes/:classId/attendance",
  authenticate,
  authorize("INSTRUCTOR", "ADMIN"),
  instructorController.getAttendanceRecords
);

module.exports = router;