const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessionAuth = require('../middlewares/sessionAuth');  

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', sessionAuth, async (req, res) => {
  try {
    // Handle admin users
    if (req.user.id === 'admin' || req.user.isAdmin) {
      return res.json({
        id: 'admin',
        username: 'admin',
        email: 'admin@gaminggarage.store',
        isAdmin: true,
        wallet: [],
        usdBalance: 0,
        referralCode: 'ADMIN',
        customPrices: [],
        hiddenProducts: []
      });
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's balance history
router.get('/balance-history', sessionAuth, authController.getBalanceHistory);

// Device lock management routes
router.post('/reset-device-lock', authController.resetDeviceLock);
router.get('/device-status', sessionAuth, authController.getDeviceStatus);

// Logout user
router.post('/logout', sessionAuth, authController.logout);

// Debug route to check user session status
router.get('/debug-session/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      userId: user._id,
      username: user.username,
      activeSession: user.activeSession,
      sessionHistory: user.sessionHistory
    });
  } catch (error) {
    console.error('Error in debug session route:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Debug route to clear user's active session
router.post('/clear-session/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.params.userId, {
      $unset: { activeSession: 1 }
    });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "Active session cleared for user: " + user.username });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Debug route to clean up all empty active sessions
router.post('/cleanup-empty-sessions', async (req, res) => {
  try {
    const User = require('../models/User');
    const result = await User.updateMany(
      { 
        $or: [
          { activeSession: { $exists: false } },
          { activeSession: null },
          { activeSession: {} },
          { 'activeSession.deviceFingerprint': { $exists: false } }
        ]
      },
      { $unset: { activeSession: 1 } }
    );
    
    res.json({ 
      message: `Cleaned up ${result.modifiedCount} users with empty active sessions`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Force logout route to clear user session
router.post('/force-logout/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const userId = req.params.userId;
    
    // Clear user's active session but KEEP device lock
    await User.findByIdAndUpdate(userId, {
      $unset: { 
        activeSession: 1
      }
    });
    
    res.json({ 
      message: `Force logged out user and cleared device lock: ${userId}`,
      userId: userId
    });
  } catch (error) {
    console.error('Error force logging out user:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Debug route to check all users with device locks
router.get('/debug-device-locks', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({
      $or: [
        { 'deviceLock.isLocked': true },
        { 'activeSession.deviceFingerprint': { $exists: true } }
      ]
    }).select('username email deviceLock activeSession isAdmin');
    
    res.json({
      message: `Found ${users.length} users with device locks or active sessions`,
      users: users.map(user => ({
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        deviceLock: user.deviceLock,
        activeSession: user.activeSession
      }))
    });
  } catch (error) {
    console.error('Error checking device locks:', error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;