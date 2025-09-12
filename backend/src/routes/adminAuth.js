const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const { adminAuth } = require("../middlewares/sessionAuth");

// Debug route to check admin login endpoint
router.get("/debug", (req, res) => {
  res.json({
    message: "Admin auth routes are working",
    sessionId: req.sessionID,
    sessionExists: !!req.session,
    timestamp: new Date().toISOString()
  });
});

router.post("/login", adminAuthController.adminLogin);
router.post("/logout", adminAuth, adminAuthController.adminLogout);

module.exports = router;