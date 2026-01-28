const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const adminController = require("../controllers/admin.controller");

// Admin only
router.post("/staff", authenticate, authorize("ADMIN"), adminController.createStaff);
router.get("/staff", authenticate, authorize("ADMIN"), adminController.listStaff);

module.exports = router;
