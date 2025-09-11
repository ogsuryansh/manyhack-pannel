const mongoose = require("mongoose");

const walletEntrySchema = new mongoose.Schema({
  amount: Number,
  addedAt: { type: Date, default: Date.now },
  expiresAt: Date
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  referralCode: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true
  },
  wallet: [walletEntrySchema],
  customPrices: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      duration: String,
      price: Number
    }
  ],
  hiddenProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  // Session-based device security
  activeSession: {
    sessionId: String,
    deviceFingerprint: String,
    userAgent: String,
    ipAddress: String,
    loginTime: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  },
  sessionHistory: [{
    sessionId: String,
    deviceFingerprint: String,
    userAgent: String,
    ipAddress: String,
    loginTime: { type: Date, default: Date.now },
    logoutTime: Date,
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);