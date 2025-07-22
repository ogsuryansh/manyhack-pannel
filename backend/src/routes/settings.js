const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

router.get("/upi", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({
      upiId: settings?.upiId || "",
      paymentEnabled: settings?.paymentEnabled !== false, 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
    res.status(500).json({ message: err.message });
  }
});

router.get("/site", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({
      websiteName: settings?.websiteName || "GAMING GARAGE",
      websiteTitle: settings?.websiteTitle || "Gaming Garage - Full Licensing Panel",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/site", async (req, res) => {
  try {
    const { websiteName, websiteTitle } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({ websiteName, websiteTitle });
    else {
      if (websiteName !== undefined) settings.websiteName = websiteName;
      if (websiteTitle !== undefined) settings.websiteTitle = websiteTitle;
      settings.settingsVersion = (settings.settingsVersion || 1) + 1;
    }
    await settings.save();
    res.json({
      websiteName: settings.websiteName,
      websiteTitle: settings.websiteTitle,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/version", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({ settingsVersion: settings?.settingsVersion || 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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