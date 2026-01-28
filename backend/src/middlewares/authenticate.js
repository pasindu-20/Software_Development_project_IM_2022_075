// backend/src/middlewares/authenticate.js
const jwt = require("jsonwebtoken");

module.exports = function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
