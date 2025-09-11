const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getDeviceInfo } = require("../utils/deviceUtils");

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Check device security
    if (decoded.deviceId) {
      const user = await User.findById(decoded.id);
      if (!user || !user.currentDevice || user.currentDevice.deviceId !== decoded.deviceId) {
        return res.status(401).json({ 
          message: "Session expired. Please login again.",
          code: "DEVICE_MISMATCH"
        });
      }
      
      // Verify current device matches
      const currentDeviceInfo = getDeviceInfo(req);
      if (user.currentDevice.deviceId !== currentDeviceInfo.deviceId) {
        return res.status(401).json({ 
          message: "Login detected on another device. Please login again.",
          code: "DEVICE_MISMATCH"
        });
      }
    }
    
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Admin middleware that accepts both admin tokens and regular user tokens with admin privileges
module.exports.adminAuth = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Check device security for admin users
    if (decoded.deviceId) {
      const user = await User.findById(decoded.id);
      if (!user || !user.currentDevice || user.currentDevice.deviceId !== decoded.deviceId) {
        return res.status(401).json({ 
          message: "Session expired. Please login again.",
          code: "DEVICE_MISMATCH"
        });
      }
      
      // Verify current device matches
      const currentDeviceInfo = getDeviceInfo(req);
      if (user.currentDevice.deviceId !== currentDeviceInfo.deviceId) {
        return res.status(401).json({ 
          message: "Login detected on another device. Please login again.",
          code: "DEVICE_MISMATCH"
        });
      }
    }
    
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