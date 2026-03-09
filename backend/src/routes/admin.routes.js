const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const adminController = require("../controllers/admin.controller");

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard/cards", adminController.dashboardCards);
router.get("/dashboard/inquiries-by-status", adminController.inquiriesByStatus);
router.get("/dashboard/monthly-revenue", adminController.monthlyRevenue);

router.post("/staff", adminController.createStaff);
router.get("/staff", adminController.listStaff);

router.get("/payments", adminController.listPayments);
router.get("/reservations", adminController.listReservations);

router.get("/events-classes", adminController.listEventsClasses);
router.post("/events-classes", adminController.createEventClass);

router.get("/play-areas", adminController.listPlayAreas);
router.post("/play-areas", adminController.createPlayArea);

module.exports = router;