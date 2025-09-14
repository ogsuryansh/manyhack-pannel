const User = require('../models/User');
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
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    console.log('Session ID from req:', req.sessionID);
    console.log('==========================');
    
    // Check if user is logged in via session
    if (!req.session || !req.session.userId) {
      console.log('No active session found - session exists:', !!req.session, 'userId:', req.session?.userId);
      return res.status(401).json({ 
        message: "No active session", 
        debug: {
          sessionExists: !!req.session,
          userId: req.session?.userId,
          sessionId: req.session?.sessionId,
          sessionKeys: req.session ? Object.keys(req.session) : 'No session'
        }
      });
    }
    
    // Check if session exists but has no userId (session corruption)
    if (req.session && !req.session.userId) {
      console.log('Session exists but corrupted - clearing session');
      req.session.destroy();
      return res.status(401).json({ 
        message: "Session corrupted. Please login again.",
        code: "SESSION_CORRUPTED"
      });
    }
    
    // Check if no session at all
    if (!req.session || !req.session.userId) {
      console.log('No active session found');
      return res.status(401).json({ 
        message: "No active session. Please login again.",
        code: "NO_SESSION"
      });
    }

    // For admin users, skip device restriction
    if (req.session.userId === 'admin') {
      console.log('Admin session validated - no device restriction');
      req.user = {
        id: req.session.userId,
        isAdmin: true,
        sessionId: req.session.sessionId
      };
      
      // Update admin session activity
      req.session.lastActivity = new Date();
      next();
      return;
    }

    // For regular users, enforce device restriction
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user has an active session
    if (!user.activeSession || !user.activeSession.deviceFingerprint) {
      console.log('No active session in user record or empty session - user can login');
      // Don't destroy session here, let the user login
      req.session.destroy();
      return res.status(401).json({ 
        message: "No active session found. Please login again.",
        code: "SESSION_EXPIRED"
      });
    }

    // Get current device info, reusing existing session ID
    const currentDeviceInfo = getDeviceInfo(req, req.session.sessionId);
    
    // Check if current session matches the active session
    if (user.activeSession.sessionId !== req.session.sessionId) {
      console.log('Session ID mismatch - different session');
      req.session.destroy();
      return res.status(401).json({ 
        message: "Login detected on another device. Please login again.",
        code: "DEVICE_MISMATCH"
      });
    }

    // Check if device fingerprint matches (prevents multiple tabs)
    if (user.activeSession.deviceFingerprint !== currentDeviceInfo.deviceFingerprint) {
      console.log('Device fingerprint mismatch - different device/tab');
      req.session.destroy();
      return res.status(401).json({ 
        message: "Login detected on another device. Please login again.",
        code: "DEVICE_MISMATCH"
      });
    }

    // Update last activity - only if active session exists
    if (user.activeSession) {
      await User.findByIdAndUpdate(user._id, {
        'activeSession.lastActivity': new Date()
      });
    }

    console.log('User session validated with device restriction');

    // Add user info to request
    req.user = {
      id: req.session.userId,
      isAdmin: false,
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
    console.log('\n=== ADMIN AUTH DEBUG ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request origin:', req.headers.origin);
    console.log('Request cookies:', req.headers.cookie);
    console.log('Session exists:', !!req.session);
    console.log('Session ID from cookie:', req.sessionID);
    console.log('Session userId:', req.session?.userId);
    console.log('Session isAdmin:', req.session?.isAdmin);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    
    // Check if session exists
    if (!req.session) {
      console.log('❌ NO SESSION OBJECT FOUND');
      return res.status(401).json({ 
        message: "No session found - please log in again",
        code: "NO_SESSION"
      });
    }
    
    // Check if user is logged in via session
    if (!req.session.userId) {
      console.log('❌ NO USER ID IN SESSION');
      return res.status(401).json({ 
        message: "No active session - please log in again",
        code: "SESSION_EXPIRED"
      });
    }
    
    // Check if this is an admin session
    if (req.session.userId !== 'admin' && !req.session.isAdmin) {
      console.log('❌ NOT AN ADMIN SESSION');
      return res.status(403).json({ 
        message: "Admin access required",
        code: "ADMIN_REQUIRED"
      });
    }

    // Ensure session is properly maintained
    req.session.touch(); // Mark session as modified
    req.session.lastAccess = new Date(); // Update last access time

    // Add user info to request
    req.user = {
      id: req.session.userId,
      isAdmin: true,
      sessionId: req.session.sessionId || req.sessionID
    };

    console.log('✅ Admin authentication successful');
    console.log('========================\n');
    next();
  } catch (err) {
    console.error('Admin session auth error:', err);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  }
};
