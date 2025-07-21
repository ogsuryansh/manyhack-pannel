const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// Get UPI ID and payment enabled status
router.get("/upi", async (req, res) => {
  const settings = await Settings.findOne();
  res.json({
    upiId: settings?.upiId || "",
    paymentEnabled: settings?.paymentEnabled !== false, // default to true
  });
});

// Admin: update UPI ID and payment enabled status
router.put("/upi", async (req, res) => {
  const { upiId, paymentEnabled } = req.body;
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings({ upiId, paymentEnabled });
  else {
    if (upiId !== undefined) settings.upiId = upiId;
    if (paymentEnabled !== undefined) settings.paymentEnabled = paymentEnabled;
  }
  await settings.save();
  res.json({
    upiId: settings.upiId,
    paymentEnabled: settings.paymentEnabled !== false,
  });
});

module.exports = router;