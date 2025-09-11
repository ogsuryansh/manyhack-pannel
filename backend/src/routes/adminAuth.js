const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const { adminAuth } = require("../middlewares/sessionAuth");

router.post("/login", adminAuthController.adminLogin);
router.post("/logout", adminAuth, adminAuthController.adminLogout);

module.exports = router;