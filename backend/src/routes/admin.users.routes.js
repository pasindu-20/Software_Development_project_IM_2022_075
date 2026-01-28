const router = require("express").Router();
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const controller = require("../controllers/admin.users.controller");

router.post(
  "/staff",
  authenticate,
  authorize("ADMIN"),
  controller.createStaffUser
);

router.get(
  "/staff",
  authenticate,
  authorize("ADMIN"),
  controller.listStaffUsers
);

module.exports = router;
