const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessionAuth = require('../middlewares/sessionAuth');  

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', sessionAuth, async (req, res) => {
  try {
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

module.exports = router;