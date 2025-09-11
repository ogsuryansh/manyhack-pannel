
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const { adminAuth } = require("../middlewares/sessionAuth"); 

router.get("/", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: "pending" });
    const approvedPayments = await Payment.countDocuments({ status: "approved" });
    res.json({
      totalUsers,
      totalProducts,
      totalPayments,
      pendingPayments,
      approvedPayments,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;