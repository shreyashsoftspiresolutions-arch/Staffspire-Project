const jwt = require("jsonwebtoken");

const generateToken = (id, role, login_id, email, name) => {
  return jwt.sign(
    {
      id,
      role,
      login_id,
      email,
      name
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;