const express = require("express");
const router = express.Router();
const { getVendorOrders, getMyOrderById, getSingleOrder, updateOrderStatus, deleteOrder, createOrder, getUserOrders, refundOrder, getVendorRefundedOrders,} = require("../controllers/orderController");
const { isVendor, isAuthenticated } = require("../middleware/authMiddleware");

router.post("/", createOrder);  
router.get("/vendor-orders/:vendorId", isVendor, getVendorOrders);
// Customer route
router.get("/my/:orderId", isAuthenticated, getMyOrderById);
// Vendor route (unchanged)
router.get("/:orderId", isVendor, getSingleOrder);
router.put("/update-status/:orderId", isVendor, updateOrderStatus);
router.delete("/:orderId", isVendor, deleteOrder);
router.get("/user-orders/:userId", isAuthenticated, getUserOrders);
router.put("/refund/:orderId", isAuthenticated, refundOrder);
router.get("/vendor-refunds/:vendorId", isVendor, getVendorRefundedOrders);

module.exports = router;
