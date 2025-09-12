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
    console.log('==========================');
    
    // Check if user is logged in via session
    if (!req.session || !req.session.userId) {
      console.log('No active session found');
      return res.status(401).json({ message: "No active session" });
    }

    // For now, just check if session data exists
    // We'll rely on express-session store for session management
    console.log('Session validation passed - using express-session store');

    // For admin users, we don't need to check User model
    if (req.session.userId === 'admin') {
      console.log('Admin session validated');
    } else {
      // For regular users, check User model
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.session.destroy();
        return res.status(401).json({ message: "User not found" });
      }
    }

    // Add user info to request
    req.user = {
      id: req.session.userId,
      isAdmin: req.session.isAdmin || (req.session.userId === 'admin'),
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
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Session exists:', !!req.session);
    console.log('Session ID from cookie:', req.sessionID);
    console.log('Session userId:', req.session?.userId);
    console.log('Session isAdmin:', req.session?.isAdmin);
    console.log('Session sessionId:', req.session?.sessionId);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    console.log('Request cookies:', req.headers.cookie);
    console.log('Full session object:', JSON.stringify(req.session, null, 2));
    
    // Check if session cookie exists
    if (!req.headers.cookie) {
      console.log('❌ NO COOKIES FOUND IN REQUEST');
      return res.status(401).json({ message: "No cookies found" });
    }
    
    // Check if session exists
    if (!req.session) {
      console.log('❌ NO SESSION OBJECT FOUND');
      return res.status(401).json({ message: "No session object" });
    }
    
    // Check if user is logged in via session
    if (!req.session.userId) {
      console.log('❌ NO USER ID IN SESSION');
      console.log('Session data:', JSON.stringify(req.session, null, 2));
      return res.status(401).json({ message: "No active session" });
    }
    
    console.log('✅ Session validation passed');
    console.log('========================\n');

    // For admin users, just check session data
    if (req.session.userId === 'admin') {
      console.log('Admin session validated');
    } else {
      // For regular users, check User model
      const user = await User.findById(req.session.userId);
      if (!user) {
        req.session.destroy();
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is admin
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
    }

    // Add user info to request
    req.user = {
      id: req.session.userId,
      isAdmin: req.session.isAdmin || (req.session.userId === 'admin'),
      sessionId: req.session.sessionId
    };

    next();
  } catch (err) {
    console.error('Admin session auth error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
