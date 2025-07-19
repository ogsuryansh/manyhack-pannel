const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  image: String, // optional, for product image/icon
  prices: [
    {
      duration: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ],
  hot: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);