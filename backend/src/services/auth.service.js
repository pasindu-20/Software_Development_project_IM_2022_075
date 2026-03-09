const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};