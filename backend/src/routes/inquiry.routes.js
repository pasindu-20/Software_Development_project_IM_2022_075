const router = require("express").Router();
const controller = require("../controllers/inquiry.controller");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

// PUBLIC
router.post("/", controller.createInquiry);

// PROTECTED (Admin/Receptionist)
router.get("/", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.getAllInquiries);
router.patch("/:id/assign", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.assignInquiry);
router.patch("/:id/status", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.updateInquiryStatus);
router.post("/:id/reply", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.replyToInquiry);
router.post("/:id/followups", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.addFollowup);
router.get("/:id/followups", authenticate, authorize("ADMIN", "RECEPTIONIST"), controller.getFollowups);

module.exports = router;