const mongoose = require("mongoose");

const topUpPlanSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  bonus: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("TopUpPlan", topUpPlanSchema); 