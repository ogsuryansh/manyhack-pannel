const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const auth = require("../middlewares/auth");

// Admin: Get all payments
router.get("/", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  try {
    const payments = await Payment.find()
      .populate("userId", "username email")
      .populate({ path: "productId", select: "name", strictPopulate: false })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Error in /api/payments:", err);
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

// Admin: Approve payment
router.put("/:id/approve", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  const payment = await Payment.findById(req.params.id);
  if (!payment || payment.type !== "add_money") {
    return res.status(400).json({ message: "Invalid payment" });
  }
  // Only update status if not already approved
  if (payment.status !== "approved") {
    payment.status = "approved";
    await payment.save();
  }
  const user = await User.findById(payment.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.wallet) user.wallet = [];
  // Prevent duplicate credits: check if this payment already credited
  const alreadyCredited = user.wallet.some(entry =>
    entry.addedAt && Math.abs(new Date(entry.addedAt) - payment.createdAt) < 10000 && entry.amount === (payment.meta && payment.meta.bonus ? payment.meta.bonus : payment.amount)
  );
  if (!alreadyCredited) {
    const creditAmount = payment.meta && payment.meta.bonus ? payment.meta.bonus : payment.amount;
    user.wallet.push({
      amount: creditAmount,
      addedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),  
    });
    await user.save();
  }
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

// Admin: Reject payment
router.put("/:id/reject", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
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
// Admin: Delete payment
router.delete("/:id", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
module.exports = router;
