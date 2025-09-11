const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Payment = require("../models/Payment");
const { adminAuth } = require("../middlewares/sessionAuth");

router.get("/", adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const search = req.query.search ? req.query.search.trim() : "";
    const searchFilter = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      User.find(searchFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(searchFilter),
    ]);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/custom-prices", adminAuth, async (req, res) => {
  const { customPrices, balance, hiddenProducts } = req.body;
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      console.error("User not found:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    user.customPrices = customPrices;
    user.hiddenProducts = hiddenProducts || [];

    if (balance && balance !== 0) {
      user.wallet = user.wallet || [];
      const now = new Date();
      if (balance > 0) {
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
        let toDeduct = Math.abs(balance);
        let availableBalance = user.wallet.reduce((sum, entry) => {
          if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
            return sum + entry.amount;
          }
          return sum;
        }, 0);
        if (availableBalance < toDeduct) {
          console.error("Insufficient balance for user:", user._id);
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

    await User.findByIdAndUpdate(req.params.id, user);
    res.json({ message: "Updated", user });
  } catch (err) {
    console.error("Error in /custom-prices:", err);
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;