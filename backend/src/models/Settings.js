const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  upiId: { type: String, required: true },
  paymentEnabled: { type: Boolean, default: true },
  settingsVersion: { type: Number, default: 1 },
  websiteName: { type: String, default: 'GAMING GARAGE' },
  websiteTitle: { type: String, default: 'Gaming Garage - Full Licensing Panel' },
});

module.exports = mongoose.model("Settings", settingsSchema);