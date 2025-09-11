const User = require('../models/User');
const Session = require('../models/Session');
const { getDeviceInfo } = require('../utils/deviceUtils');

// Session-based authentication middleware
module.exports = async function (req, res, next) {
  try {
    console.log('=== SESSION AUTH DEBUG ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Session exists:', !!req.session);
    console.log('Session userId:', req.session?.userId);
    console.log('Session sessionId:', req.session?.sessionId);
    console.log('==========================');
    
    // Check if user is logged in via session
    if (!req.session || !req.session.userId) {
      console.log('No active session found');
      return res.status(401).json({ message: "No active session" });
    }

    // Verify session exists and is active
    const session = await Session.findOne({
      sessionId: req.session.sessionId,
      userId: req.session.userId,
      isActive: true
    });

    if (!session) {
      // Session not found or inactive
      req.session.destroy();
      return res.status(401).json({ 
        message: "Session expired. Please login again.",
        code: "SESSION_EXPIRED"
      });
    }

    // Get user information
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ message: "User not found" });
    }

    // Check device fingerprint for additional security
    const currentDeviceInfo = getDeviceInfo(req);
    if (user.activeSession && user.activeSession.deviceFingerprint !== currentDeviceInfo.deviceFingerprint) {
      // Device mismatch - invalidate session
      await Session.findOneAndUpdate(
        { sessionId: req.session.sessionId },
        { isActive: false, logoutTime: new Date() }
      );
      
      req.session.destroy();
      return res.status(401).json({ 
        message: "Login detected on another device. Please login again.",
        code: "DEVICE_MISMATCH"
      });
    }

    // Update last activity
    await Session.findByIdAndUpdate(session._id, { lastActivity: new Date() });
    await User.findByIdAndUpdate(user._id, { 'activeSession.lastActivity': new Date() });

    // Add user info to request
    req.user = {
      id: user._id,
      isAdmin: user.isAdmin,
      sessionId: req.session.sessionId
    };

    next();
  } catch (err) {
    console.error('Session auth error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin session middleware
module.exports.adminAuth = async function (req, res, next) {
  try {
    console.log('=== ADMIN AUTH DEBUG ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Session exists:', !!req.session);
    console.log('Session userId:', req.session?.userId);
    console.log('Session isAdmin:', req.session?.isAdmin);
    console.log('========================');
    
    // Check if user is logged in via session
    if (!req.session || !req.session.userId) {
      console.log('No active session found for admin');
      return res.status(401).json({ message: "No active session" });
    }

    // Verify session exists and is active
    const session = await Session.findOne({
      sessionId: req.session.sessionId,
      userId: req.session.userId,
      isActive: true
    });

    if (!session) {
      req.session.destroy();
      return res.status(401).json({ 
        message: "Session expired. Please login again.",
        code: "SESSION_EXPIRED"
      });
    }

    // Get user information
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check device fingerprint for additional security
    const currentDeviceInfo = getDeviceInfo(req);
    if (user.activeSession && user.activeSession.deviceFingerprint !== currentDeviceInfo.deviceFingerprint) {
      await Session.findOneAndUpdate(
        { sessionId: req.session.sessionId },
        { isActive: false, logoutTime: new Date() }
      );
      
      req.session.destroy();
      return res.status(401).json({ 
        message: "Login detected on another device. Please login again.",
        code: "DEVICE_MISMATCH"
      });
    }

    // Update last activity
    await Session.findByIdAndUpdate(session._id, { lastActivity: new Date() });
    await User.findByIdAndUpdate(user._id, { 'activeSession.lastActivity': new Date() });

    // Add user info to request
    req.user = {
      id: user._id,
      isAdmin: user.isAdmin,
      sessionId: req.session.sessionId
    };

    next();
  } catch (err) {
    console.error('Admin session auth error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
