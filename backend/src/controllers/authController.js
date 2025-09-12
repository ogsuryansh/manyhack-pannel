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
      // Check if user is already logged in on ANY device
      if (user.activeSession) {
        // Check if it's the same device (same fingerprint)
        if (user.activeSession.deviceFingerprint !== deviceInfo.deviceFingerprint) {
          // Different device - reject login
          return res.status(401).json({ 
            message: "You are already logged in on another device. Please logout from the other device first or contact support.",
            code: "DEVICE_ALREADY_LOGGED_IN"
          });
        } else {
          // Same device - check if session is still valid
          if (user.activeSession.sessionId !== req.session.sessionId) {
            // Same device but different session - update session
            console.log('Same device, updating session');
          }
        }
      }
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

    // Update user's active session
    await User.findByIdAndUpdate(user._id, {
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
    });

    // Store user info in session
    req.session.userId = user._id;
    req.session.sessionId = deviceInfo.sessionId;
    req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
    req.session.isAdmin = user.isAdmin;
    
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

// Logout user and clear session information
exports.logout = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (sessionId) {
      // Mark session as inactive
      await Session.findOneAndUpdate(
        { sessionId: sessionId },
        { isActive: false, logoutTime: new Date() }
      );
      
      // Update user's active session
      await User.findByIdAndUpdate(req.session.userId, {
        $unset: { activeSession: 1 },
        $set: {
          'sessionHistory.$[elem].logoutTime': new Date(),
          'sessionHistory.$[elem].isActive': false
        }
      }, {
        arrayFilters: [{ 'elem.sessionId': sessionId, 'elem.isActive': true }]
      });
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: "Server error" });
  }
};