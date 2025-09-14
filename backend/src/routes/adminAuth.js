const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const { adminAuth } = require("../middlewares/sessionAuth");

// Debug route to check admin login endpoint
router.get("/debug", (req, res) => {
  res.json({
    message: "Admin auth routes are working",
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    timestamp: new Date().toISOString()
  });
});

// Test admin login endpoint
router.post("/test-login", (req, res) => {
  console.log('=== TEST ADMIN LOGIN ENDPOINT ===');
  console.log('Request body:', req.body);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('================================');
  
  res.json({
    message: "Test admin login endpoint reached",
    requestBody: req.body,
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    timestamp: new Date().toISOString()
  });
});

// Debug admin credentials
router.get("/debug-credentials", (req, res) => {
  console.log('=== ADMIN CREDENTIALS DEBUG ===');
  console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
  console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET');
  console.log('================================');
  
  res.json({
    message: "Admin credentials debug",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "NOT SET",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "SET" : "NOT SET",
    timestamp: new Date().toISOString()
  });
});

// Check if admin is logged in (for frontend verification)
router.get("/check", (req, res) => {
  console.log('=== ADMIN CHECK DEBUG ===');
  console.log('Request origin:', req.headers.origin);
  console.log('Request cookies:', req.headers.cookie);
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session userId:', req.session?.userId);
  console.log('Session isAdmin:', req.session?.isAdmin);
  console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
  console.log('========================');
  
  // Check if session exists and has admin data
  const isLoggedIn = req.session && req.session.userId === 'admin' && req.session.isAdmin;
  
  if (!isLoggedIn) {
    console.log('❌ Admin not logged in - session invalid');
    return res.status(401).json({
      isLoggedIn: false,
      message: "Not authenticated",
      sessionId: req.sessionID,
      userId: req.session?.userId,
      isAdmin: req.session?.isAdmin,
      sessionExists: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookies: req.headers.cookie ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('✅ Admin check passed');
  res.json({
    isLoggedIn: true,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    isAdmin: req.session?.isAdmin,
    sessionExists: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    cookies: req.headers.cookie ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

router.post("/login", adminAuthController.adminLogin);
router.post("/logout", adminAuth, adminAuthController.adminLogout);

// Check session status
router.get("/session-status", (req, res) => {
  res.json({
    sessionExists: !!req.session,
    userId: req.session?.userId,
    isAdmin: req.session?.isAdmin,
    sessionId: req.sessionID,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    cookies: req.headers.cookie ? 'Present' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

// Simple session validation endpoint
router.get("/validate", (req, res) => {
  const isValid = req.session && req.session.userId === 'admin' && req.session.isAdmin;
  
  if (isValid) {
    res.json({ valid: true, message: "Session is valid" });
  } else {
    res.status(401).json({ 
      valid: false, 
      message: "Session is invalid or expired",
      sessionData: {
        sessionExists: !!req.session,
        userId: req.session?.userId,
        isAdmin: req.session?.isAdmin
      }
    });
  }
});

module.exports = router;