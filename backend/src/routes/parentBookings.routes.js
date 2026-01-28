const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/parentBookings.controller");

router.post("/bookings", authenticate, authorize("PARENT"), controller.createBooking);
router.get("/bookings", authenticate, authorize("PARENT"), controller.getMyBookings);

module.exports = router;
