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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);