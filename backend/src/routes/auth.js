const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth'); // <-- add this

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/me', authMiddleware, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

module.exports = router;