const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sessionAuth = require('../middlewares/sessionAuth');
const { deviceResetLimiter, loginLimiter } = require('../middlewares/rateLimiter');  

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

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
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error('❌ /auth/me - Error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's balance history
router.get('/balance-history', sessionAuth, authController.getBalanceHistory);

// Device lock management routes
router.post('/reset-device-lock', deviceResetLimiter, sessionAuth, authController.resetDeviceLock);
router.get('/device-status', sessionAuth, authController.getDeviceStatus);

// Logout user
router.post('/logout', sessionAuth, authController.logout);

// Debug routes removed for security - they exposed sensitive user data without authentication

module.exports = router;