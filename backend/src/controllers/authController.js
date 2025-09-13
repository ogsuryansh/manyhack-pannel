const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const BalanceHistory = require('../models/BalanceHistory');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const { getDeviceInfo } = require('../utils/deviceUtils');

exports.register = async (req, res) => {
  try {
    const { email, username, password, referralCode } = req.body;
    if (!email || !username || !password || !referralCode) {
      return res.status(400).json({ message: "All fields including referral code are required." });
    }

    // Validate referral code
    const referral = await ReferralCode.findOne({ 
      code: referralCode.toUpperCase(), 
      isActive: true 
    });

    if (!referral) {
      return res.status(400).json({ message: "Invalid or inactive referral code." });
    }

    // Check if max usage limit is reached
    if (referral.maxUsage && referral.usageCount >= referral.maxUsage) {
      return res.status(400).json({ message: "Referral code usage limit reached." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      email, 
      username, 
      password: hash, 
      referralCode: referralCode.toUpperCase() 
    });

    // Increment referral code usage count
    await ReferralCode.findByIdAndUpdate(referral._id, {
      $inc: { usageCount: 1 }
    });

    // Give reward to the referrer if reward amount is set
    if (referral.rewardAmount > 0 && referral.createdBy) {
      try {
        // Find the user who created this referral code
        const referrer = await User.findById(referral.createdBy);
        if (referrer) {
          // Add reward to referrer's wallet
          const rewardEntry = {
            amount: referral.rewardAmount,
            addedAt: new Date(),
            expiresAt: null // No expiration for referral rewards
          };
          
          await User.findByIdAndUpdate(referrer._id, {
            $push: { wallet: rewardEntry }
          });

          // Add to balance history for referrer
          await BalanceHistory.create({
            userId: referrer._id,
            amount: referral.rewardAmount,
            type: 'referral_reward',
            description: `💰 Referral Reward: +₹${referral.rewardAmount} for "${referral.code}" used by ${username}`,
            referenceId: referral._id,
            referenceModel: 'ReferralCode',
            metadata: {
              referredUser: user._id,
              referredUsername: username,
              referralCode: referral.code,
              action: 'referrer_reward'
            }
          });
        }
      } catch (rewardError) {
        console.error('Error giving referral reward to referrer:', rewardError);
        // Don't fail registration if reward giving fails
      }
    }

    // Give reward to the user who used the referral code
    if (referral.rewardAmount > 0) {
      try {
        // Add reward to the new user's wallet
        const userRewardEntry = {
          amount: referral.rewardAmount,
          addedAt: new Date(),
          expiresAt: null // No expiration for referral rewards
        };
        
        await User.findByIdAndUpdate(user._id, {
          $push: { wallet: userRewardEntry }
        });

        // Add to balance history for the new user
        await BalanceHistory.create({
          userId: user._id,
          amount: referral.rewardAmount,
          type: 'referral_reward',
          description: `🎉 Welcome Bonus: +₹${referral.rewardAmount} for using code "${referral.code}"`,
          referenceId: referral._id,
          referenceModel: 'ReferralCode',
          metadata: {
            referralCode: referral.code,
            referrerId: referral.createdBy,
            action: 'user_welcome_bonus'
          }
        });
      } catch (rewardError) {
        console.error('Error giving referral reward to new user:', rewardError);
        // Don't fail registration if reward giving fails
      }
    }

    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        return res.status(400).json({ message: "Email already exists." });
      }
      if (err.keyPattern?.username) {
        return res.status(400).json({ message: "Username already exists." });
      }
      return res.status(400).json({ message: "Duplicate field." });
    }
    res.status(500).json({ message: "Server error." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Get device information
    const deviceInfo = getDeviceInfo(req);
    
    // For regular users (not admin), enforce single device restriction
    if (!user.isAdmin) {
      console.log('Checking device lock for user:', user.username);
      console.log('User device lock:', user.deviceLock);
      console.log('Current device fingerprint:', deviceInfo.deviceFingerprint);
      
      // Check if user has device lock enabled
      if (user.deviceLock && user.deviceLock.isLocked) {
        console.log('User has device lock enabled');
        
        // Check if it's the same device (same fingerprint)
        if (user.deviceLock.currentDevice !== deviceInfo.deviceFingerprint) {
          console.log('Different device detected - rejecting login');
          // Different device - reject login
          return res.status(401).json({ 
            message: "You are already logged in on another device. Please reset device lock from your current device first (available after 24 hours).",
            code: "DEVICE_LOCKED"
          });
        } else {
          console.log('Same device detected - allowing login');
          // Same device - allow login and update session
        }
      } else {
        console.log('No device lock found - setting up device lock');
        // No device lock - set up device lock for this user
      }
    } else {
      console.log('Admin user - no device restriction');
    }

    // Create new session in Session model
    const newSession = new Session({
      sessionId: deviceInfo.sessionId,
      userId: user._id,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress
    });
    await newSession.save();

    // Update user's active session and device lock
    const updateData = {
      activeSession: {
        sessionId: deviceInfo.sessionId,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        loginTime: new Date(),
        lastActivity: new Date()
      },
      $push: {
        sessionHistory: {
          sessionId: deviceInfo.sessionId,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          loginTime: new Date(),
          isActive: true
        }
      }
    };

    // For regular users, set up or maintain device lock
    if (!user.isAdmin) {
      updateData.deviceLock = {
        isLocked: true,
        lockedAt: new Date(),
        currentDevice: deviceInfo.deviceFingerprint,
        currentSessionId: deviceInfo.sessionId
      };
    }

    await User.findByIdAndUpdate(user._id, updateData);

    // Store user info in session
    console.log('Storing session data:', {
      userId: user._id,
      sessionId: deviceInfo.sessionId,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      isAdmin: user.isAdmin
    });
    
    req.session.userId = user._id;
    req.session.sessionId = deviceInfo.sessionId;
    req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
    req.session.isAdmin = user.isAdmin;
    
    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      } else {
        console.log('Session saved successfully');
      }
    });
    
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        wallet: user.wallet,
        usdBalance: user.usdBalance || 0,
        isAdmin: user.isAdmin,
        referralCode: user.referralCode,
        customPrices: user.customPrices,
        hiddenProducts: user.hiddenProducts
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get user's balance history
exports.getBalanceHistory = async (req, res) => {
  try {
    const BalanceHistory = require('../models/BalanceHistory');
    const ReferralCode = require('../models/ReferralCode');
    
    const history = await BalanceHistory.find({ userId: req.user.id })
      .populate('referenceId', 'code description')
      .sort({ createdAt: -1 })
      .limit(50); // Last 50 transactions
    
    // Process the history to include more details
    const processedHistory = history.map(entry => ({
      ...entry.toObject(),
      referralCode: entry.referenceId?.code || entry.metadata?.referralCode || 'N/A',
      referralDescription: entry.referenceId?.description || 'N/A'
    }));
    
    res.json(processedHistory);
  } catch (err) {
    console.error('Error getting balance history:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset device lock for current user
exports.resetDeviceLock = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (req.user.isAdmin) {
      return res.status(400).json({ 
        message: "Admin users don't have device lock restrictions." 
      });
    }
    
    // Get user's current device lock status
    const user = await User.findById(userId).select('deviceLock');
    
    if (!user.deviceLock || !user.deviceLock.isLocked) {
      return res.status(400).json({ 
        message: "No active device lock found." 
      });
    }
    
    // Check if 24 hours have passed since device lock was created
    const lockTime = new Date(user.deviceLock.lockedAt);
    const now = new Date();
    const hoursSinceLock = (now - lockTime) / (1000 * 60 * 60); // Convert to hours
    
    if (hoursSinceLock < 24) {
      const remainingHours = Math.ceil(24 - hoursSinceLock);
      return res.status(400).json({ 
        message: `Device lock can only be reset after 24 hours. Please wait ${remainingHours} more hour(s).`,
        code: "RESET_COOLDOWN",
        remainingHours: remainingHours,
        lockedAt: user.deviceLock.lockedAt
      });
    }
    
    // Clear device lock
    await User.findByIdAndUpdate(userId, {
      $unset: { deviceLock: 1 }
    });
    
    console.log('Device lock reset for user:', userId, 'after 24+ hours');
    res.json({ 
      message: "Device lock reset successfully. You can now login on other devices.",
      success: true
    });
  } catch (err) {
    console.error('Reset device lock error:', err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get device lock status for current user
exports.getDeviceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('deviceLock isAdmin');
    
    if (req.user.isAdmin) {
      return res.json({ 
        isAdmin: true,
        deviceLock: null,
        message: "Admin users don't have device lock restrictions."
      });
    }
    
    let canReset = false;
    let remainingHours = 0;
    
    if (user.deviceLock && user.deviceLock.isLocked) {
      const lockTime = new Date(user.deviceLock.lockedAt);
      const now = new Date();
      const hoursSinceLock = (now - lockTime) / (1000 * 60 * 60);
      
      if (hoursSinceLock >= 24) {
        canReset = true;
      } else {
        remainingHours = Math.ceil(24 - hoursSinceLock);
      }
    }
    
    res.json({
      isAdmin: false,
      deviceLock: user.deviceLock,
      isLocked: user.deviceLock ? user.deviceLock.isLocked : false,
      lockedAt: user.deviceLock ? user.deviceLock.lockedAt : null,
      canReset: canReset,
      remainingHours: remainingHours
    });
  } catch (err) {
    console.error('Get device status error:', err);
    res.status(500).json({ message: "Server error." });
  }
};

// Logout user and clear session information
exports.logout = async (req, res) => {
  try {
    const sessionId = req.session?.sessionId;
    const userId = req.session?.userId;
    
    console.log('Logout process started for user:', userId, 'session:', sessionId);
    
    if (sessionId && userId) {
      try {
        // Mark session as inactive in Session model
        await Session.findOneAndUpdate(
          { sessionId: sessionId },
          { isActive: false, logoutTime: new Date() }
        );
        
        // Clear user's active session and device lock completely
        await User.findByIdAndUpdate(userId, {
          $unset: { 
            activeSession: 1,
            deviceLock: 1
          }
        });
        
        // Update session history to mark as inactive
        await User.findByIdAndUpdate(userId, {
          $set: {
            'sessionHistory.$[elem].logoutTime': new Date(),
            'sessionHistory.$[elem].isActive': false
          }
        }, {
          arrayFilters: [{ 'elem.sessionId': sessionId, 'elem.isActive': true }]
        });
        
        console.log('User active session cleared for user:', userId);
      } catch (dbError) {
        console.error('Database error during logout:', dbError);
        // Continue with session destruction even if DB operations fail
      }
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Server error" });
      }
      console.log('Session destroyed successfully');
      res.json({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: "Server error" });
  }
};