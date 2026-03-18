const router = require("express").Router();
const controller = require("../controllers/reception.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

router.get(
  "/dashboard/summary",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.dashboardSummary
);

router.get(
  "/bookings",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.listBookings
);

router.post(
  "/bookings/manual",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.createManualBooking
);

router.get(
  "/payments/cash",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.listCashPayments
);

router.post(
  "/payments/cash/:id/confirm",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.confirmCashPayment
);

router.get(
  "/payments/booking/:bookingId",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.getBookingPaymentDetails
);

router.post(
  "/payments/booking/:bookingId",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.saveBookingPayment
);

router.get(
  "/enrollments",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.listEnrollments
);

router.post(
  "/enrollments",
  authenticate,
  authorize("RECEPTIONIST"),
  controller.createEnrollment
);

module.exports = router;