const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/payment.controller");

router.post("/payments", authenticate, authorize("PARENT"), controller.createPayment);

module.exports = router;
