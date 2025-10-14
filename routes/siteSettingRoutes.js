const express = require("express");
const router = express.Router();
const { getPublicSiteSettings, getSiteSettings, updateSiteSettings } = require("../controllers/siteSettingController");
const { isAdmin } = require("../middleware/authMiddleware");

// Multer configuration for file upload
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public read-only
router.get("/public", getPublicSiteSettings);

// Admin endpoints
router.get("/", isAdmin, getSiteSettings);
router.put("/", isAdmin, upload.single("logo"), updateSiteSettings);

module.exports = router;
