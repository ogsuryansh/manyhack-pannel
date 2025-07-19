const mongoose = require("mongoose");

const keySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  duration: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  assignedAt: Date,
  expiresAt: Date,
  isUsed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Key", keySchema);