const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const adminOnly = [authenticate, authorize("ADMIN")];

// staff
router.post("/staff", ...adminOnly, adminController.createStaff);
router.get("/staff", ...adminOnly, adminController.listStaff);

// dashboard
router.get("/dashboard/cards", ...adminOnly, adminController.dashboardCards);
router.get("/dashboard/inquiries-by-status", ...adminOnly, adminController.inquiriesByStatus);
router.get("/dashboard/monthly-revenue", ...adminOnly, adminController.monthlyRevenue);

// classes and events
router.get("/instructors", ...adminOnly, adminController.listInstructors);
router.get("/events-classes", ...adminOnly, adminController.listEventsClasses);
router.post("/events-classes", ...adminOnly, adminController.createEventClass);
router.put("/events-classes/:id", ...adminOnly, adminController.updateEventClass);
router.patch("/events-classes/:id/status", ...adminOnly, adminController.updateEventClassStatus);
router.delete("/events-classes/:id", ...adminOnly, adminController.deleteEventClass);

// play areas
router.get("/play-areas", ...adminOnly, adminController.listPlayAreas);
router.post("/play-areas", ...adminOnly, adminController.createPlayArea);

module.exports = router;