const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/parent.controller");

// All parent endpoints
router.get("/me", authenticate, authorize("PARENT"), controller.me);

router.get("/classes", authenticate, authorize("PARENT"), controller.listClasses);

router.post("/children", authenticate, authorize("PARENT"), controller.addChild);
router.get("/children", authenticate, authorize("PARENT"), controller.listChildren);

router.post("/enroll", authenticate, authorize("PARENT"), controller.enroll);
router.get("/enrollments", authenticate, authorize("PARENT"), controller.myEnrollments);

router.get("/payments", authenticate, authorize("PARENT"), controller.myPayments);

module.exports = router;
