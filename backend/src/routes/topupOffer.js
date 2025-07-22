const express = require("express");
const router = express.Router();
const TopupOffer = require("../models/TopupOffer");
const auth = require("../middlewares/auth");
const User = require("../models/User");

// Get all active offers (for users)
router.get("/", async (req, res) => {
  const offers = await TopupOffer.find({ isActive: true }).sort({ amount: 1 });
  res.json(offers);
});

// Admin: Get all offers
router.get("/admin", auth, async (req, res) => {
  console.log("ADMIN ROUTE USER:", req.user); // DEBUG
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  const offers = await TopupOffer.find().sort({ amount: 1 });
  res.json(offers);
});

// Admin: Create offer
router.post("/admin", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  const { amount, bonus, description, isActive } = req.body;
  if (!amount || !bonus) return res.status(400).json({ message: "Amount and bonus required" });
  const offer = new TopupOffer({ amount, bonus, description, isActive });
  await offer.save();
  res.status(201).json(offer);
});

// Admin: Update offer
router.put("/admin/:id", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  const { amount, bonus, description, isActive } = req.body;
  const offer = await TopupOffer.findByIdAndUpdate(
    req.params.id,
    { amount, bonus, description, isActive },
    { new: true }
  );
  if (!offer) return res.status(404).json({ message: "Offer not found" });
  res.json(offer);
});

// Admin: Delete offer
router.delete("/admin/:id", auth, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden" });
  const offer = await TopupOffer.findByIdAndDelete(req.params.id);
  if (!offer) return res.status(404).json({ message: "Offer not found" });
  res.json({ message: "Offer deleted" });
});

// User: Purchase an offer (creates a pending payment)
router.post("/purchase", auth, async (req, res) => {
  console.log("PURCHASE ENDPOINT USER:", req.user); // DEBUG
  const { offerId, utr, payerName } = req.body;
  const offer = await TopupOffer.findById(offerId);
  console.log("PURCHASE ENDPOINT OFFER:", offer); // DEBUG
  if (!offer || !offer.isActive) return res.status(400).json({ message: "Invalid offer" });
  // Create a payment request (pending)
  const Payment = require("../models/Payment");
  const payment = new Payment({
    userId: req.user.id,
    amount: offer.amount,
    utr,
    payerName,
    status: "pending",
    type: "add_money",
    meta: { offerId, bonus: offer.bonus },
  });
  await payment.save();
  console.log("PURCHASE ENDPOINT PAYMENT CREATED:", payment); // DEBUG
  res.json({ message: "Purchase request submitted", payment });
});

module.exports = router; 