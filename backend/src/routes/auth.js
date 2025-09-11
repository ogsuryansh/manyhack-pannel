const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');  

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authMiddleware, async (req, res) => {
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
router.get('/balance-history', authMiddleware, authController.getBalanceHistory);

module.exports = router;