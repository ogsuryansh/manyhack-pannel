const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../models/User");
const Product = require("../models/Product");
const Key = require("../models/Key");
const Payment = require("../models/Payment");

// Get all keys for a product+duration
router.get("/", async (req, res) => {
  try {
    const { productId, duration } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (duration) filter.duration = duration;
    const keys = await Key.find(filter).populate(
      "assignedTo",
      "username email"
    );
    res.json(keys);
  } catch (err) {
    console.error("Error in GET /api/keys:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get key stats for a product+duration
router.get("/stats", async (req, res) => {
  try {
    const { productId, duration } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (duration) filter.duration = duration;

    const total = await Key.countDocuments(filter);
    const available = await Key.countDocuments({ ...filter, assignedTo: null });
    const assigned = await Key.countDocuments({
      ...filter,
      assignedTo: { $ne: null },
    });
    const expired = await Key.countDocuments({
      ...filter,
      expiresAt: { $lt: new Date() },
    });

    res.json({ total, available, assigned, expired });
  } catch (err) {
    console.error("Error in GET /api/keys/stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all keys for the logged-in user
router.get("/user", auth, async (req, res) => {
  try {
    const keys = await Key.find({ assignedTo: req.user.id })
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    console.error("Error in GET /api/keys/user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all keys for a specific user (for admin)
router.get("/user/:userId", async (req, res) => {
  try {
    const keys = await Key.find({ assignedTo: req.params.userId })
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    console.error("Error in GET /api/keys/user/:userId:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk add keys (skips duplicates)
router.post("/bulk", async (req, res) => {
  try {
    const { productId, duration, keys } = req.body;
    console.log("Bulk add keys request:", { productId, duration, keys });

    // Validate productId
    if (!productId) {
      console.error("Missing productId");
      return res.status(400).json({ message: "Missing productId" });
    }
    // Validate duration
    if (!duration) {
      console.error("Missing duration");
      return res.status(400).json({ message: "Missing duration" });
    }
    // Validate keys
    if (!Array.isArray(keys) || keys.length === 0) {
      console.error("Keys array is missing or empty");
      return res
        .status(400)
        .json({ message: "Keys array is missing or empty" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.error("Product not found:", productId);
      return res.status(400).json({ message: "Product not found" });
    }

    // Check if duration is valid for this product
    const validDuration = product.prices.some((pr) => pr.duration === duration);
    if (!validDuration) {
      console.error("Invalid duration for this product:", duration);
      return res
        .status(400)
        .json({ message: "Invalid duration for this product" });
    }

    // Prepare key docs
    const keyDocs = keys.map((key) => ({
      key,
      productId,
      duration,
    }));

    await Key.insertMany(keyDocs, { ordered: false }); // skip duplicates
    res.json({ message: "Keys added" });
  } catch (err) {
    console.error("Error in POST /api/keys/bulk:", err);
    res.status(400).json({ message: err.message });
  }
});

// Edit a key
router.put("/:id", async (req, res) => {
  try {
    const { key } = req.body;
    const updated = await Key.findByIdAndUpdate(
      req.params.id,
      { key },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/keys/:id:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a key
router.delete("/:id", async (req, res) => {
  try {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ message: "Key deleted" });
  } catch (err) {
    console.error("Error in DELETE /api/keys/:id:", err);
    res.status(400).json({ message: err.message });
  }
});

// Buy key with wallet
router.post("/buy", auth, async (req, res) => {
  try {
    const { productId, duration, quantity } = req.body;
    const user = await User.findById(req.user.id);
    const now = new Date();

    // Calculate available balance (not expired)
    let availableBalance = 0;
    user.wallet = user.wallet.filter((entry) => {
      if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
        availableBalance += entry.amount;
        return true;
      }
      return false;
    });

    // Get price for product+duration
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const priceObj = product.prices.find((pr) => pr.duration === duration);
    if (!priceObj) return res.status(400).json({ message: "Invalid duration" });
    const totalPrice = priceObj.price * quantity;

    if (availableBalance < totalPrice) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct from wallet (FIFO)
    let toDeduct = totalPrice;
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

    // Assign keys
    const availableKeys = await Key.find({
      productId,
      duration,
      assignedTo: null,
    }).limit(quantity);

    if (availableKeys.length < quantity) {
      return res.status(400).json({ message: "Not enough keys available" });
    }

    for (let i = 0; i < quantity; i++) {
      availableKeys[i].assignedTo = user._id;
      availableKeys[i].assignedAt = now;
      availableKeys[i].expiresAt = new Date(
        now.getTime() + parseDuration(duration)
      );
      await availableKeys[i].save();
    }

    await user.save();

    // Record the debit in Payment history
    await Payment.create({
      userId: user._id,
      productId,
      duration,
      amount: totalPrice,
      status: "approved",
      type: "buy_key",
      meta: {
        quantity,
        assignedKeyIds: availableKeys.map((k) => k._id),
      },
      createdAt: now,
    });

    res.json({ message: "Key(s) assigned", keys: availableKeys });
  } catch (err) {
    console.error("Error in POST /api/keys/buy:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to parse duration string to ms
function parseDuration(duration) {
  if (duration.includes("Day")) return parseInt(duration) * 24 * 60 * 60 * 1000;
  if (duration.includes("Month"))
    return parseInt(duration) * 30 * 24 * 60 * 60 * 1000;
  if (duration.includes("Year"))
    return parseInt(duration) * 365 * 24 * 60 * 60 * 1000;
  return 0;
}

module.exports = router;
