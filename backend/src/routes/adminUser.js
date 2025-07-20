const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Payment = require("../models/Payment");

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:id/custom-prices", async (req, res) => {
  const { customPrices, balance, hiddenProducts } = req.body; // <-- add hiddenProducts
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.customPrices = customPrices;

    // Save hiddenProducts
    user.hiddenProducts = hiddenProducts || [];

    // If balance is set and not zero, add or deduct from wallet
    if (balance && balance !== 0) {
      user.wallet = user.wallet || [];
      const now = new Date();
      if (balance > 0) {
        // Add money
        user.wallet.push({
          amount: balance,
          addedAt: now,
          expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        });
        await Payment.create({
          userId: user._id,
          amount: balance,
          status: "approved",
          type: "add_money",
          meta: { source: "admin" },
          createdAt: now,
        });
      } else {
        // Deduct money (FIFO)
        let toDeduct = Math.abs(balance);
        let availableBalance = user.wallet.reduce((sum, entry) => {
          if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
            return sum + entry.amount;
          }
          return sum;
        }, 0);
        if (availableBalance < toDeduct) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        for (const entry of user.wallet) {
          if (toDeduct <= 0) break;
          if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
            if (entry.amount <= toDeduct) {
              toDeduct -= entry.amount;
              entry.amount = 0;
            } else {
              entry.amount -= toDeduct;
              toDeduct = 0;
            }
          }
        }
        user.wallet = user.wallet.filter((entry) => entry.amount > 0);
        await Payment.create({
          userId: user._id,
          amount: Math.abs(balance),
          status: "approved",
          type: "deduct_money",
          meta: { source: "admin" },
          createdAt: now,
        });
      }
    }

    await user.save();
    res.json({ message: "Updated", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
