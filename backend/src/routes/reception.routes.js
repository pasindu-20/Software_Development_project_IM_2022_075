const router = require("express").Router();
const controller = require("../controllers/reception.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

router.get(
  "/dashboard/summary",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.dashboardSummary
);

router.get(
  "/bookings",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.listBookings
);

router.post(
  "/bookings/manual",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.createManualBooking
);

router.get(
  "/payments/cash",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.listCashPayments
);

router.post(
  "/payments/cash/:id/confirm",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.confirmCashPayment
);

router.get(
  "/payments/bank-transfer",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.listBankTransferPayments
);

router.post(
  "/payments/bank-transfer/:id/confirm",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.confirmBankTransferPayment
);

router.get(
  "/payments/booking/:bookingId",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.getBookingPaymentDetails
);

router.post(
  "/payments/booking/:bookingId",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.saveBookingPayment
);

router.get(
  "/enrollments",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.listEnrollments
);

router.post(
  "/enrollments",
  authenticate,
  authorize("RECEPTIONIST", "ADMIN"),
  controller.createEnrollment
);

module.exports = router;