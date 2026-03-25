const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/payment.controller");

router.post("/payments", authenticate, authorize("PARENT"), controller.createPayment);

// Stripe card payment routes
router.post(
  "/payments/stripe/create-intent",
  authenticate,
  authorize("PARENT"),
  controller.createStripePaymentIntent
);

router.post(
  "/payments/stripe/finalize",
  authenticate,
  authorize("PARENT"),
  controller.finalizeStripePayment
);

module.exports = router;