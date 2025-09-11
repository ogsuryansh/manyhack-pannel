const express = require("express");
const router = express.Router();
const ReferralCode = require("../models/ReferralCode");
const User = require("../models/User");
const { adminAuth } = require("../middlewares/sessionAuth");

// Get all referral codes (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const referralCodes = await ReferralCode.find()
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });
    
    // Handle cases where createdBy might be null
    const processedCodes = referralCodes.map(code => ({
      ...code.toObject(),
      createdBy: code.createdBy || { username: 'System', email: 'system@admin.local' }
    }));
    
    res.json(processedCodes);
  } catch (err) {
    console.error("Error in GET /api/referral:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get referral code statistics (admin only) - MUST come before /:id route
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalCodes = await ReferralCode.countDocuments();
    const activeCodes = await ReferralCode.countDocuments({ isActive: true });
    const totalUsage = await ReferralCode.aggregate([
      { $group: { _id: null, totalUsage: { $sum: "$usageCount" } } }
    ]);
    
    const topCodes = await ReferralCode.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select("code description usageCount maxUsage createdBy");

    res.json({
      totalCodes,
      activeCodes,
      totalUsage: totalUsage[0]?.totalUsage || 0,
      topCodes
    });
  } catch (err) {
    console.error("Error in GET /api/referral/stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific referral code by ID (admin only)
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const referralCode = await ReferralCode.findById(req.params.id)
      .populate("createdBy", "username email");
    
    if (!referralCode) {
      return res.status(404).json({ message: "Referral code not found" });
    }

    // Handle case where createdBy might be null
    const processedCode = {
      ...referralCode.toObject(),
      createdBy: referralCode.createdBy || { username: 'System', email: 'system@admin.local' }
    };
    
    res.json(processedCode);
  } catch (err) {
    console.error("Error in GET /api/referral/:id:", err);
    res.status(400).json({ message: err.message });
  }
});

// Create a new referral code (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { code, description, maxUsage, rewardAmount } = req.body;
    
    if (!code || !description) {
      return res.status(400).json({ message: "Code and description are required" });
    }

    // Check if code already exists
    const existingCode = await ReferralCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: "Referral code already exists" });
    }

    // For admin users, we'll use a special admin ID or find/create an admin user
    let createdBy = null;
    
    // If it's the hardcoded admin token, find or create an admin user
    if (req.user.id === 'admin') {
      const User = require("../models/User");
      let adminUser = await User.findOne({ isAdmin: true });
      if (!adminUser) {
        // Create a default admin user if none exists
        adminUser = await User.create({
          email: 'admin@system.local',
          username: 'admin',
          password: 'dummy', // This won't be used for login
          isAdmin: true,
          referralCode: 'ADMIN'
        });
      }
      createdBy = adminUser._id;
    } else {
      createdBy = req.user.id;
    }

    const referralCode = new ReferralCode({
      code: code.toUpperCase(),
      description,
      maxUsage: maxUsage || null,
      rewardAmount: rewardAmount || 0,
      createdBy: createdBy
    });

    await referralCode.save();
    if (createdBy) {
      await referralCode.populate("createdBy", "username email");
    }
    res.status(201).json(referralCode);
  } catch (err) {
    console.error("Error in POST /api/referral:", err);
    res.status(400).json({ message: err.message });
  }
});

// Update a referral code (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { code, description, isActive, maxUsage, rewardAmount } = req.body;
    
    const referralCode = await ReferralCode.findById(req.params.id);
    if (!referralCode) {
      return res.status(404).json({ message: "Referral code not found" });
    }

    // If code is being changed, check for duplicates
    if (code && code.toUpperCase() !== referralCode.code) {
      const existingCode = await ReferralCode.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingCode) {
        return res.status(400).json({ message: "Referral code already exists" });
      }
    }

    const updatedCode = await ReferralCode.findByIdAndUpdate(
      req.params.id,
      {
        ...(code && { code: code.toUpperCase() }),
        ...(description && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(maxUsage !== undefined && { maxUsage }),
        ...(rewardAmount !== undefined && { rewardAmount })
      },
      { new: true }
    );
    
    if (updatedCode.createdBy) {
      await updatedCode.populate("createdBy", "username email");
    }

    res.json(updatedCode);
  } catch (err) {
    console.error("Error in PUT /api/referral/:id:", err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a referral code (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const referralCode = await ReferralCode.findById(req.params.id);
    if (!referralCode) {
      return res.status(404).json({ message: "Referral code not found" });
    }

    // Delete the referral code regardless of usage
    await ReferralCode.findByIdAndDelete(req.params.id);
    res.json({ message: "Referral code deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /api/referral/:id:", err);
    res.status(400).json({ message: err.message });
  }
});

// Validate referral code (public endpoint for signup)
router.get("/validate/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const referralCode = await ReferralCode.findOne({ 
      code, 
      isActive: true 
    });

    if (!referralCode) {
      return res.status(404).json({ 
        valid: false, 
        message: "Invalid or inactive referral code" 
      });
    }

    // Check if max usage limit is reached
    if (referralCode.maxUsage && referralCode.usageCount >= referralCode.maxUsage) {
      return res.status(400).json({ 
        valid: false, 
        message: "Referral code usage limit reached" 
      });
    }

    res.json({ 
      valid: true, 
      code: referralCode.code,
      description: referralCode.description 
    });
  } catch (err) {
    console.error("Error in GET /api/referral/validate/:code:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
