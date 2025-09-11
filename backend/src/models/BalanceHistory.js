const mongoose = require("mongoose");

const balanceHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['referral_reward', 'purchase', 'admin_add', 'admin_deduct', 'refund', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['ReferralCode', 'Payment', 'User', null]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Index for faster lookups
balanceHistorySchema.index({ userId: 1, createdAt: -1 });
balanceHistorySchema.index({ type: 1 });

module.exports = mongoose.model('BalanceHistory', balanceHistorySchema);
