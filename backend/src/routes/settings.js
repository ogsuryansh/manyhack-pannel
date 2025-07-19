const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// Get UPI ID
router.get("/upi", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings({ upiId: "ishashwat@fam" });
    await settings.save();
  }
  res.json({ upiId: settings.upiId });
});

// Admin: update UPI ID
router.put("/upi", async (req, res) => {
  const { upiId } = req.body;
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings({ upiId });
  else settings.upiId = upiId;
  await settings.save();
  res.json({ upiId: settings.upiId });
});

module.exports = router;