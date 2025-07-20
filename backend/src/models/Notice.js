const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  text: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notice", noticeSchema);