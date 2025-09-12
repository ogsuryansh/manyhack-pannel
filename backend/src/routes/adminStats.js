
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const { adminAuth } = require("../middlewares/sessionAuth"); 

router.get("/", adminAuth, async (req, res) => {
  try {
    console.log('=== ADMIN STATS API DEBUG ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Session ID:', req.sessionID);
    console.log('User ID:', req.user?.id);
    console.log('Is Admin:', req.user?.isAdmin);
    console.log('=============================');
    
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: "pending" });
    const approvedPayments = await Payment.countDocuments({ status: "approved" });
    
    const stats = {
      totalUsers,
      totalProducts,
      totalPayments,
      pendingPayments,
      approvedPayments,
    };
    
    console.log('Stats data:', stats);
    console.log('Sending JSON response...');
    
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  }
});

module.exports = router;