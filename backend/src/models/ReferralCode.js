const mongoose = require("mongoose");

const referralCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  usageCount: { 
    type: Number, 
    default: 0 
  },
  maxUsage: { 
    type: Number, 
    default: null // null means unlimited
  },
  rewardAmount: {
    type: Number,
    default: 0, // Amount to give to the referrer when someone uses this code
    min: 0
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false 
  }
}, { timestamps: true });

// Index for faster lookups
referralCodeSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('ReferralCode', referralCodeSchema);
