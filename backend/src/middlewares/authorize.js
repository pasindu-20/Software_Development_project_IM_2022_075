module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role; // must be "PARENT"/"ADMIN"/...
    if (!role) return res.status(401).json({ message: "Unauthorized" });

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};
