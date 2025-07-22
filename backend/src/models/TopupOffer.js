const mongoose = require("mongoose");

const topupOfferSchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // Amount user pays
  bonus: { type: Number, required: true },  // Amount credited to wallet
  isActive: { type: Boolean, default: true },
  description: { type: String }, // Optional, e.g. "₹100 = ₹170"
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

topupOfferSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("TopupOffer", topupOfferSchema); 