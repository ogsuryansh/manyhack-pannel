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
    console.log('Session sessionId:', req.session?.sessionId);
    console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
    
    // Check if session cookie exists (but don't block if session exists)
    if (!req.headers.cookie && !req.session) {
      console.log('❌ NO COOKIES FOUND IN REQUEST AND NO SESSION');
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
      
      // If this is an admin request and no userId, try to reinitialize session
      if (req.url.includes('/admin/') && req.session) {
        console.log('Attempting to reinitialize admin session...');
        
        // Check if this might be a valid admin session that got corrupted
        if (req.session.isAdmin === true || req.session.sessionId) {
          console.log('🔧 ADMIN AUTH: Found potential admin session data, attempting recovery...');
          
          // Try to restore admin session data
          req.session.userId = 'admin';
          req.session.isAdmin = true;
          
          // Ensure session has required fields
          if (!req.session.sessionId) {
            req.session.sessionId = req.sessionID;
          }
          
          // Save the recovered session
          req.session.save((err) => {
            if (err) {
              console.error('❌ ADMIN AUTH RECOVERY FAILED:', err);
            } else {
              console.log('✅ ADMIN AUTH RECOVERY SUCCESS: Admin session restored');
              console.log('Recovered session data:', JSON.stringify(req.session, null, 2));
            }
          });
          
          // Continue with the request after recovery
          console.log('✅ Admin session recovered, continuing with request');
        } else {
          console.log('🔧 ADMIN AUTH: No valid admin session data found');
          return res.status(401).json({ 
            message: "No active session - please log in again",
            code: "SESSION_EXPIRED",
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
      } else {
        return res.status(401).json({ 
          message: "No active session - please log in again",
          code: "SESSION_EXPIRED",
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
        console.error(`ADMIN AUDIT: Non-admin user ${req.session.userId} (${user.username || user.email}) attempted admin access`);
        return res.status(403).json({ message: "Admin access required" });
      }

      // Additional security: Check if admin user is still active
      if (user.isBlocked || user.isDeleted) {
        console.error(`ADMIN AUDIT: Blocked/deleted admin user ${req.session.userId} attempted admin access`);
        req.session.destroy();
        return res.status(403).json({ message: "Account is blocked or deleted" });
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
