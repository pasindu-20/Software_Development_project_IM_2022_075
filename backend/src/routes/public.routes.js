const router = require("express").Router();
const controller = require("../controllers/public.controller");

router.get("/classes", controller.listPublicClasses);
router.get("/events", controller.listPublicEvents);
router.get("/play-areas", controller.listPublicPlayAreas);
router.get("/party-packages", controller.listPublicPartyPackages);
router.get("/play-areas/availability", controller.getPlayAreaAvailability);

module.exports = router;