const jwt = require("jsonwebtoken");

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { isAdmin: true, username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({
      token,
      admin: { username, isAdmin: true }
    });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
};