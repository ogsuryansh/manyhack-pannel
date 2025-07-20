const express = require("express");
const router = express.Router();
const Notice = require("../models/Notice");

// Get current notice
router.get("/", async (req, res) => {
  const notice = await Notice.findOne().sort({ updatedAt: -1 });
  res.json({ text: notice?.text || "" });
});

// Admin: update notice
router.put("/", async (req, res) => {
  const { text } = req.body;
  let notice = await Notice.findOne();
  if (!notice) notice = new Notice({ text });
  else notice.text = text;
  notice.updatedAt = new Date();
  await notice.save();
  res.json({ text: notice.text });
});

module.exports = router;