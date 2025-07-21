const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, 
  duration: String,
  amount: Number,
  utr: String,
  payerName: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  type: { type: String, enum: ["add_money", "deduct_money", "buy_key"], required: true },
  meta: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", paymentSchema);