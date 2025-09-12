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
    console.log('Request origin:', req.headers.origin);
    console.log('Request cookies:', req.headers.cookie);
    console.log('Session exists:', !!req.session);
    console.log('Session ID from cookie:', req.sessionID);
    console.log('Session userId:', req.session?.userId);
    console.log('Session isAdmin:', req.session?.isAdmin);
    console.log('Session sessionId:', req.session?.sessionId);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    
    // Check if session cookie exists
    if (!req.headers.cookie) {
      console.log('❌ NO COOKIES FOUND IN REQUEST');
      return res.status(401).json({ 
        message: "No cookies found - please log in again",
        debug: {
          url: req.url,
          method: req.method,
          origin: req.headers.origin,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check if session exists
    if (!req.session) {
      console.log('❌ NO SESSION OBJECT FOUND');
      return res.status(401).json({ 
        message: "No session found - please log in again",
        debug: {
          url: req.url,
          method: req.method,
          origin: req.headers.origin,
          sessionId: req.sessionID,
          cookies: req.headers.cookie,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check if user is logged in via session
    if (!req.session.userId) {
      console.log('❌ NO USER ID IN SESSION');
      console.log('Session data:', JSON.stringify(req.session, null, 2));
      return res.status(401).json({ 
        message: "No active session - please log in again",
        debug: {
          url: req.url,
          method: req.method,
          origin: req.headers.origin,
          sessionId: req.sessionID,
          sessionKeys: req.session ? Object.keys(req.session) : 'No session',
          cookies: req.headers.cookie,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log('✅ Session validation passed');

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
