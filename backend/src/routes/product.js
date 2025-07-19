const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Public: Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Add a product
router.post("/", async (req, res) => {
  try {
    const { name, description, image, prices, hot } = req.body;
    const product = new Product({ name, description, image, prices, hot });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Edit a product
router.put("/:id", async (req, res) => {
  try {
    const { name, description, image, prices, hot } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, image, prices, hot },
      { new: true }
    );
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin: Delete a product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;