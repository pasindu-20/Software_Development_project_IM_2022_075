const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role_id
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};
