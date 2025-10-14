const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  registerVendor,
  loginVendor,
  forgotVendorPassword,
  resetVendorPassword,
  logoutVendor,
  getVendorInfo,
  getVendorProfile,
  updateVendorProfile,
  updateVendorAvatar,
  getAllVendors,
  getVendorStatistics,
  createOrUpdateBankInfo,
  getVendorNotifications,
  getVendorNotificationCount,
  markVendorNotificationAsRead,
  deleteVendorNotification,
} = require('../controllers/vendorController');
const { isVendor } = require("../middleware/authMiddleware");


// Middleware
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage, limits: { fieldSize: 25 * 1024 * 1024 } });


router.get("/notifications", isVendor, getVendorNotifications);
router.get("/notifications/count", isVendor, getVendorNotificationCount);
router.put("/notifications/:id/read", isVendor, markVendorNotificationAsRead);
router.delete("/notifications/:id", isVendor, deleteVendorNotification);

router.get('/profile', isVendor, getVendorProfile); 

router.post('/register', upload.single("avatar"), registerVendor);
router.post('/login', loginVendor);
router.post('/forgot-password', forgotVendorPassword);
router.post('/reset-password', resetVendorPassword);
router.get('/logout', logoutVendor);
router.get('/:id', getVendorInfo);
router.get('/', getAllVendors); 
router.get('/:id/statistics', getVendorStatistics);  
router.put('/update-vendor-info', updateVendorProfile);
router.put('/update-avatar/:id', upload.single("avatar"), updateVendorAvatar);
router.route("/:vendorId/bank-info").post(createOrUpdateBankInfo).put(createOrUpdateBankInfo);



module.exports = router;
