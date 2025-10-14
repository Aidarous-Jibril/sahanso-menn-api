const express = require('express')
const router = express.Router()
const {
  createCouponCode,
  getAllCouponCodes,
  deleteCouponCode,
  getCouponCodeValue,
  updateCouponCode
} = require('../controllers/couponCodeController')
const { isVendor } = require('../middleware/authMiddleware')

router.post("/create", isVendor, createCouponCode);
router.get("/vendor/:vendorId", isVendor, getAllCouponCodes);
router.get("/:name/value", getCouponCodeValue);
router.delete("/:id", isVendor, deleteCouponCode);
router.put("/:id", isVendor, updateCouponCode);

module.exports = router;
