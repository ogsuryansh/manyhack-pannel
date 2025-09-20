const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const sessionAuth = require("../middlewares/sessionAuth");
const { adminAuth } = require("../middlewares/sessionAuth");
const TopUpPlan = require("../models/TopUpPlan");

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search ? req.query.search.trim() : "";
    let userIds = undefined;
    if (search) {
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select('_id');
      userIds = users.map(u => u._id);
    }
    const paymentFilter = userIds ? { userId: { $in: userIds } } : {};
    const [payments, total] = await Promise.all([
      Payment.find(paymentFilter)
        .populate("userId", "username email")
        .populate({ path: "productId", select: "name", strictPopulate: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(paymentFilter),
    ]);
    res.json({ payments, total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all purchases with detailed information for admin
router.get("/purchases", adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search ? req.query.search.trim() : "";
    const status = req.query.status || "";
    const type = req.query.type || "";
    
    // Build filter
    let filter = {};
    
    // Search filter
    if (search) {
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select('_id');
      filter.userId = { $in: users.map(u => u._id) };
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Type filter
    if (type) {
      filter.type = type;
    }
    
    const [purchases, total] = await Promise.all([
      Payment.find(filter)
        .populate("userId", "username email referralCode")
        .populate({ 
          path: "productId", 
          select: "name description", 
          strictPopulate: false 
        })
        .populate("processedBy", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);
    
    // Process purchases to include all necessary details
    const processedPurchases = purchases.map(purchase => {
      const user = purchase.userId;
      const product = purchase.productId;
      
      return {
        _id: purchase._id,
        // User Information
        username: user?.username || "N/A",
        email: user?.email || "N/A",
        referralCode: user?.referralCode || "N/A",
        
        // Product Information
        productName: purchase.productName || product?.name || "N/A",
        productDescription: product?.description || "N/A",
        duration: purchase.duration || "N/A",
        quantity: purchase.quantity || 1,
        
        // Financial Information
        amount: purchase.amount || 0,
        unitPrice: purchase.unitPrice || 0,
        totalPrice: purchase.totalPrice || purchase.amount || 0,
        
        // Payment Details
        paymentMethod: purchase.paymentMethod || "N/A",
        
        // Status and Type
        status: purchase.status || "N/A",
        type: purchase.type || "N/A",
        
        // Additional Information
        description: purchase.description || "N/A",
        notes: purchase.notes || "N/A",
        
        // Admin Information
        processedBy: purchase.processedBy?.username || "N/A",
        processedAt: purchase.processedAt || "N/A",
        
        // Metadata
        meta: purchase.meta || {},
        
        // Timestamps
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt
      };
    });
    
    // Calculate total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { ...filter, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.json({ 
      purchases: processedPurchases, 
      total, 
      totalRevenue: totalRevenue[0]?.total || 0 
    });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add-money", sessionAuth, async (req, res) => {
  // Check if user is admin - admin users cannot add money
  if (req.user.id === 'admin' || req.user.isAdmin) {
    return res.status(403).json({ 
      message: "Admin users cannot add money. Please use a regular user account." 
    });
  }
  
  const { amount, utr, payerName, meta } = req.body;
  const payment = new Payment({
    userId: req.user.id,
    amount,
    unitPrice: amount,
    totalPrice: amount,
    utr: utr || "N/A",
    payerName: payerName || "N/A",
    status: "pending",
    type: "add_money",
    description: `Add money request for ₹${amount}`,
    paymentMethod: "bank_transfer",
    meta: {
      ...meta,
      source: "user",
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    },
  });
  await payment.save();
  res.json({ message: "Add money request submitted", payment });
});

router.put("/:id/approve", async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (
    !payment ||
    payment.status !== "pending" ||
    payment.type !== "add_money"
  ) {
    return res.status(400).json({ message: "Invalid payment" });
  }
  payment.status = "approved";
  await payment.save();
  const user = await User.findById(payment.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.wallet) user.wallet = [];
  // Offer logic: credit bonus if present
  let creditAmount = payment.amount;
  let offerHint = undefined;
  if (payment.meta && payment.meta.offer && payment.meta.bonus) {
    creditAmount = payment.meta.bonus;
    offerHint = `Offer Plan: Paid ₹${payment.amount}, Credited ₹${creditAmount}`;
  }
  user.wallet.push({
    amount: creditAmount,
    addedAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),  
    offerHint,
  });
  await user.save();
  res.json(payment);
});

router.post("/deduct-money", adminAuth, async (req, res) => {
  try {
    const { userId, amount, note } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Missing userId or amount" });
    }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const now = new Date();
  let availableBalance = 0;
  user.wallet = user.wallet.filter((entry) => {
    if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
      availableBalance += entry.amount;
      return true;
    }
    return false;
  });

  if (availableBalance < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  let toDeduct = amount;
  for (const entry of user.wallet) {
    if (toDeduct <= 0) break;
    if (entry.amount <= toDeduct) {
      toDeduct -= entry.amount;
      entry.amount = 0;
    } else {
      entry.amount -= toDeduct;
      toDeduct = 0;
    }
  }
  user.wallet = user.wallet.filter((entry) => entry.amount > 0);

  await user.save();

  await Payment.create({
    userId,
    amount,
    unitPrice: amount,
    totalPrice: amount,
    status: "approved",
    type: "deduct_money",
    description: `Admin deducted ₹${amount} from wallet${note ? ` - ${note}` : ''}`,
    paymentMethod: "admin_action",
    processedBy: req.user.id,
    processedAt: now,
    meta: { 
      note, 
      source: "admin",
      adminId: req.user.id,
      adminAction: "manual_deduction",
      timestamp: now.toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    },
    createdAt: now,
  });

  // Also create BalanceHistory entry
  const BalanceHistory = require('../models/BalanceHistory');
  await BalanceHistory.create({
    userId,
    amount: -amount, // Negative amount for deduction
    type: 'admin_deduct',
    description: `Admin deducted ₹${amount} from wallet${note ? ` - ${note}` : ''}`,
    metadata: {
      adminId: req.user.id,
      adminAction: "manual_deduction",
      note: note || '',
      timestamp: now.toISOString()
    }
  });

  // Log the admin action for audit trail
  console.log(`ADMIN AUDIT: User ${req.user.id} deducted ₹${amount} from user ${userId}. Note: ${note || 'No note provided'}`);

  res.json({ message: "Money deducted", user });
  } catch (error) {
    console.error('Error in deduct-money:', error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/reject", async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json(payment);
});

router.get("/user", sessionAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ADMIN: Get all top-up plans
router.get("/topup-plans", adminAuth, async (req, res) => {
  try {
    const plans = await TopUpPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Create a new top-up plan
router.post("/topup-plans", adminAuth, async (req, res) => {
  try {
    const { amount, bonus, isActive } = req.body;
    const plan = new TopUpPlan({ amount, bonus, isActive });
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Update a top-up plan
router.put("/topup-plans/:id", adminAuth, async (req, res) => {
  try {
    const { amount, bonus, isActive } = req.body;
    const plan = await TopUpPlan.findByIdAndUpdate(
      req.params.id,
      { amount, bonus, isActive },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Delete a top-up plan
router.delete("/topup-plans/:id", adminAuth, async (req, res) => {
  try {
    await TopUpPlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: Get active top-up plans
router.get("/topup-plans/active", sessionAuth, async (req, res) => {
  try {
    const plans = await TopUpPlan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: Top-up wallet with a plan
router.post("/topup", sessionAuth, async (req, res) => {
  try {
    // Check if user is admin - admin users cannot top up wallet
    if (req.user.id === 'admin' || req.user.isAdmin) {
      return res.status(403).json({ 
        message: "Admin users cannot top up wallet. Please use a regular user account." 
      });
    }
    
    const { planId } = req.body;
    const plan = await TopUpPlan.findById(planId);
    if (!plan || !plan.isActive) return res.status(400).json({ message: "Invalid plan" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.wallet) user.wallet = [];
    user.wallet.push({
      amount: plan.bonus,
      addedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
    await user.save();
    await Payment.create({
      userId: user._id,
      amount: plan.amount,
      unitPrice: plan.amount,
      totalPrice: plan.amount,
      status: "approved",
      type: "topup",
      description: `Top-up with ${plan.name} plan`,
      paymentMethod: "topup_plan",
      meta: { 
        planId, 
        credited: plan.bonus,
        topupPlan: {
          name: plan.name,
          amount: plan.amount,
          bonus: plan.bonus
        },
        source: "user",
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer')
      },
      createdAt: new Date(),
    });
    res.json({ message: "Wallet credited", bonus: plan.bonus });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
