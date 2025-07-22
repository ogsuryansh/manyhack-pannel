const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const TopUpPlan = require("../models/TopUpPlan");

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "username email")
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add-money", auth, async (req, res) => {
  const { amount, utr, payerName, meta } = req.body;
  const payment = new Payment({
    userId: req.user.id,
    amount,
    utr,
    payerName,
    status: "pending",
    type: "add_money",
    meta,
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

router.post("/deduct-money", async (req, res) => {
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
    status: "approved",
    type: "deduct_money",
    meta: { note, source: "admin" },
    createdAt: now,
  });

  res.json({ message: "Money deducted", user });
});

router.put("/:id/reject", async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json(payment);
});

router.get("/user", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 });
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
router.get("/topup-plans", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
    const plans = await TopUpPlan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Create a new top-up plan
router.post("/topup-plans", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
    const { amount, bonus, isActive } = req.body;
    const plan = new TopUpPlan({ amount, bonus, isActive });
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Update a top-up plan
router.put("/topup-plans/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
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
router.delete("/topup-plans/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });
    await TopUpPlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: Get active top-up plans
router.get("/topup-plans/active", auth, async (req, res) => {
  try {
    const plans = await TopUpPlan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// USER: Top-up wallet with a plan
router.post("/topup", auth, async (req, res) => {
  try {
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
      status: "approved",
      type: "add_money",
      meta: { planId, credited: plan.bonus },
      createdAt: new Date(),
    });
    res.json({ message: "Wallet credited", bonus: plan.bonus });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
