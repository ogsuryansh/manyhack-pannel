const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

router.get("/upi", async (req, res) => {
  const settings = await Settings.findOne();
  res.json({
    upiId: settings?.upiId || "",
    paymentEnabled: settings?.paymentEnabled !== false, 
  });
});

router.put("/upi", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Error in PUT /api/settings/upi:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get settings version
router.get("/version", async (req, res) => {
  const settings = await Settings.findOne();
  res.json({ settingsVersion: settings?.settingsVersion || 1 });
});

// Admin: increment settings version to trigger refresh
router.post("/refresh-version", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ upiId: "", paymentEnabled: true, settingsVersion: 2 });
    } else {
      settings.settingsVersion = (settings.settingsVersion || 1) + 1;
    }
    await settings.save();
    res.json({ success: true, settingsVersion: settings.settingsVersion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;