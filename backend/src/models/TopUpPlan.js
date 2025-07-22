const mongoose = require("mongoose");

const topUpPlanSchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // base amount user pays
  bonus: { type: Number, required: true }, // amount credited to wallet
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("TopUpPlan", topUpPlanSchema); 