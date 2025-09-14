const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Payment = require("../models/Payment");
const { adminAuth } = require("../middlewares/sessionAuth");

// Rate limiting for admin operations
const adminOperationLimits = new Map();
const ADMIN_RATE_LIMIT = {
  maxOperations: 10, // Max 10 operations per minute
  windowMs: 60 * 1000, // 1 minute window
  maxBalanceChange: 50000 // Max ₹50,000 total balance changes per hour
};

function checkAdminRateLimit(adminId, operationType = 'general') {
  const now = Date.now();
  const key = `${adminId}_${operationType}`;
  
  if (!adminOperationLimits.has(key)) {
    adminOperationLimits.set(key, {
      operations: [],
      totalBalanceChange: 0,
      lastReset: now
    });
  }
  
  const limit = adminOperationLimits.get(key);
  
  // Reset if window has passed
  if (now - limit.lastReset > ADMIN_RATE_LIMIT.windowMs) {
    limit.operations = [];
    limit.totalBalanceChange = 0;
    limit.lastReset = now;
  }
  
  // Check operation count
  if (limit.operations.length >= ADMIN_RATE_LIMIT.maxOperations) {
    return { allowed: false, reason: 'Rate limit exceeded: Too many operations' };
  }
  
  // Check balance change limit
  if (operationType === 'balance' && limit.totalBalanceChange >= ADMIN_RATE_LIMIT.maxBalanceChange) {
    return { allowed: false, reason: 'Rate limit exceeded: Balance change limit reached' };
  }
  
  return { allowed: true };
}

function recordAdminOperation(adminId, operationType, balanceChange = 0) {
  const now = Date.now();
  const key = `${adminId}_${operationType}`;
  
  if (!adminOperationLimits.has(key)) {
    adminOperationLimits.set(key, {
      operations: [],
      totalBalanceChange: 0,
      lastReset: now
    });
  }
  
  const limit = adminOperationLimits.get(key);
  limit.operations.push(now);
  limit.totalBalanceChange += Math.abs(balanceChange);
}

router.get("/", adminAuth, async (req, res) => {
  try {
    // Maintain session
    req.session.touch();
    req.session.lastAccess = new Date();
    
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
    // Maintain session
    req.session.touch();
    req.session.lastAccess = new Date();
    
    // Validate admin permissions
    if (!req.user || !req.user.isAdmin) {
      console.error("Unauthorized admin access attempt:", req.user?.id);
      return res.status(403).json({ message: "Admin access required" });
    }

    const user = await User.findById(req.params.id).lean();
    if (!user) {
      console.error("User not found:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Check rate limits for admin operations
    const rateLimitCheck = checkAdminRateLimit(req.user.id, balance !== 0 ? 'balance' : 'general');
    if (!rateLimitCheck.allowed) {
      console.error(`ADMIN AUDIT: Rate limit exceeded for admin ${req.user.id}: ${rateLimitCheck.reason}`);
      return res.status(429).json({ message: rateLimitCheck.reason });
    }

    // Log admin action attempt
    console.log(`ADMIN AUDIT: Admin ${req.user.id} attempting to modify user ${req.params.id} (${user.username || user.email})`);

    user.customPrices = customPrices;
    user.hiddenProducts = hiddenProducts || [];

    if (balance && balance !== 0) {
      user.wallet = user.wallet || [];
      const now = new Date();
      
      // Validate balance amount limits
      const maxBalanceChange = 10000; // Maximum ₹10,000 per operation
      if (Math.abs(balance) > maxBalanceChange) {
        console.error(`ADMIN AUDIT: Admin ${req.user.id} attempted excessive balance change: ₹${balance} for user ${req.params.id}`);
        return res.status(400).json({ message: `Balance change cannot exceed ₹${maxBalanceChange}` });
      }

      if (balance > 0) {
        console.log(`ADMIN AUDIT: Admin ${req.user.id} adding ₹${balance} to user ${req.params.id} (${user.username || user.email})`);
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
          meta: { 
            source: "admin",
            adminId: req.user.id,
            adminAction: "manual_addition",
            timestamp: now.toISOString()
          },
          createdAt: now,
        });

        // Also create BalanceHistory entry
        const BalanceHistory = require('../models/BalanceHistory');
        await BalanceHistory.create({
          userId: user._id,
          amount: balance,
          type: 'admin_add',
          description: `Admin added ₹${balance} to wallet`,
          metadata: {
            adminId: req.user.id,
            adminAction: "manual_addition",
            timestamp: now.toISOString()
          }
        });
      } else {
        let toDeduct = Math.abs(balance);
        console.log(`ADMIN AUDIT: Admin ${req.user.id} deducting ₹${toDeduct} from user ${req.params.id} (${user.username || user.email})`);
        
        let availableBalance = user.wallet.reduce((sum, entry) => {
          if (!entry.expiresAt || new Date(entry.expiresAt) > now) {
            return sum + entry.amount;
          }
          return sum;
        }, 0);
        
        if (availableBalance < toDeduct) {
          console.error(`ADMIN AUDIT: Insufficient balance for user ${user._id}. Available: ₹${availableBalance}, Requested: ₹${toDeduct}`);
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
          meta: { 
            source: "admin",
            adminId: req.user.id,
            adminAction: "manual_deduction",
            timestamp: now.toISOString()
          },
          createdAt: now,
        });

        // Also create BalanceHistory entry
        const BalanceHistory = require('../models/BalanceHistory');
        await BalanceHistory.create({
          userId: user._id,
          amount: -Math.abs(balance), // Negative amount for deduction
          type: 'admin_deduct',
          description: `Admin deducted ₹${Math.abs(balance)} from wallet`,
          metadata: {
            adminId: req.user.id,
            adminAction: "manual_deduction",
            timestamp: now.toISOString()
          }
        });
      }
    }

    await User.findByIdAndUpdate(req.params.id, user);
    
    // Record the admin operation for rate limiting
    recordAdminOperation(req.user.id, balance !== 0 ? 'balance' : 'general', balance || 0);
    
    // Log successful admin action
    console.log(`ADMIN AUDIT: Admin ${req.user.id} successfully updated user ${req.params.id} (${user.username || user.email})`);
    
    res.json({ message: "Updated", user });
  } catch (err) {
    console.error(`ADMIN AUDIT ERROR: Admin ${req.user?.id} failed to update user ${req.params.id}:`, err);
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    // Validate admin permissions
    if (!req.user || !req.user.isAdmin) {
      console.error("Unauthorized admin delete attempt:", req.user?.id);
      return res.status(403).json({ message: "Admin access required" });
    }

    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log admin delete action
    console.log(`ADMIN AUDIT: Admin ${req.user.id} deleting user ${req.params.id} (${userToDelete.username || userToDelete.email})`);

    await User.findByIdAndDelete(req.params.id);
    
    console.log(`ADMIN AUDIT: Admin ${req.user.id} successfully deleted user ${req.params.id}`);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(`ADMIN AUDIT ERROR: Admin ${req.user?.id} failed to delete user ${req.params.id}:`, err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;