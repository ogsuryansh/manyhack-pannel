const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Admin middleware that accepts both admin tokens and regular user tokens with admin privileges
module.exports.adminAuth = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    // Check if it's an admin token or a regular user with admin privileges
    if (decoded.isAdmin || decoded.role === 'admin') {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};