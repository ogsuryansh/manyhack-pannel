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

// Check if admin is logged in (for frontend verification)
router.get("/check", (req, res) => {
  console.log('=== ADMIN CHECK DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Session userId:', req.session?.userId);
  console.log('Session isAdmin:', req.session?.isAdmin);
  console.log('Session keys:', req.session ? Object.keys(req.session) : 'No session');
  console.log('========================');
  
  const isLoggedIn = req.session && req.session.userId === 'admin' && req.session.isAdmin;
  
  res.json({
    isLoggedIn,
    sessionId: req.sessionID,
    userId: req.session?.userId,
    isAdmin: req.session?.isAdmin,
    timestamp: new Date().toISOString()
  });
});

router.post("/login", adminAuthController.adminLogin);
router.post("/logout", adminAuth, adminAuthController.adminLogout);

module.exports = router;