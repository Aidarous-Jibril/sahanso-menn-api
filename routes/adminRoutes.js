// adminRoutes.js
const express = require("express");
const { isAdmin } = require("../middleware/authMiddleware"); 
const path = require('path');
const multer = require('multer');
const {
     registerAdmin, 
    loginAdmin, 
    forgotPasswordAdmin,
    resetPasswordAdmin,
    getAdminProfile,
    updateAdminProfile,
    logoutAdmin,
    getAllUsers, 
    getUserById,
    updateUser, 
    deleteUser, 
    getAllVendors,
    getVendorById, 
    updateVendor, 
    deleteVendor, 
    blockVendor,
    unblockVendor,
    getAllProducts,
    createProduct,
    getProductById,
    editProduct,
    deleteProduct,
    getAllOrders,
    getOrderById,
    deleteOrder,
    updateOrderStatus,
    updateOrder,
    refundOrder,
    getUserOrders,
    getAllCategories,
    addCategory,
    getCategoryById,
    editCategory,
    deleteCategory,
    getAllSubCategories,
    createSubCategory,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    getAllSubSubCategories,
    createSubSubCategory,
    getSubSubCategoryById,
    updateSubSubCategory,
    deleteSubSubCategory,
    getAllCoupons,
    getCouponById,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    createSale,
    getAllSales,
    getSaleById,
    updateSale,
    deleteSale,
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    adminRefundOrder,
    updateAdminSecurity,
    getAdminDashboardStats,
    getWeeklyTrends,
    getAdminNotificationCount,
    getAdminNotifications,
    markNotificationAsRead,
    deleteAdminNotification,
 } = require("../controllers/adminController");

const router = express.Router();

// Admin
router.post('/register', registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPasswordAdmin);
router.post("/reset-password", resetPasswordAdmin);
router.get("/profile", isAdmin, getAdminProfile); 
router.put("/profile", isAdmin, updateAdminProfile);
router.get("/logout", logoutAdmin);

// User Management
router.get("/users", isAdmin, getAllUsers);
router.get("/users/:id", isAdmin, getUserById);
router.put("/users/:id", isAdmin, updateUser);
router.delete("/users/:id", isAdmin, deleteUser);

// Vendor Management
router.get("/vendors", isAdmin, getAllVendors);
router.get("/vendors/:id", isAdmin, getVendorById);
router.put("/vendors/:id", isAdmin, updateVendor);
router.delete("/vendors/:id", isAdmin, deleteVendor);
router.patch("/vendors/:id/block", isAdmin, blockVendor);  
router.patch("/vendors/:id/unblock", isAdmin, unblockVendor);  

// Order Management
router.get("/orders", isAdmin, getAllOrders);
router.get("/orders/:id", isAdmin, getOrderById);
router.get("/orders/user/:userId", isAdmin, getUserOrders);  
router.put("/orders/:id/status", isAdmin, updateOrderStatus);
router.put("/orders/:id", isAdmin, updateOrder);
router.patch("/orders/:id/refund", isAdmin, refundOrder);
router.delete("/orders/:id", isAdmin, deleteOrder);


// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const isValid = filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype);
    cb(isValid ? null : new Error("Only images are allowed"), isValid);
  },
});


// Product Management
router.get("/products", isAdmin, getAllProducts);
router.post("/products", isAdmin, upload.array("images", 5), createProduct);
router.get("/products/:id", isAdmin, getProductById);
// router.patch("/products/:id/approve", isAdmin, approveProduct);
router.put("/products/:id", isAdmin, editProduct);
router.delete("/products/:id", isAdmin, deleteProduct);

// Category Management
router.get("/categories", isAdmin, getAllCategories);
router.post("/categories", isAdmin, addCategory);
router.get("/categories/:id", isAdmin, getCategoryById);
router.put("/categories/:id", isAdmin, editCategory);
router.delete("/categories/:id", isAdmin, deleteCategory);

// SubCategory Management
router.get("/subcategories", isAdmin, getAllSubCategories);
router.post("/subcategories", isAdmin, createSubCategory);
router.get("/subcategories/:id", isAdmin, getSubCategoryById);
router.put("/subcategories/:id", isAdmin, updateSubCategory);
router.delete("/subcategories/:id", isAdmin, deleteSubCategory);

// Sub-SubCategory Management
router.get("/subsubcategories", isAdmin, getAllSubSubCategories);
router.post("/subsubcategories", isAdmin, createSubSubCategory);
router.get("/subsubcategories/:id", isAdmin, getSubSubCategoryById);
router.put("/subsubcategories/:id", isAdmin, updateSubSubCategory); 
router.delete("/subsubcategories/:id", isAdmin, deleteSubSubCategory);

// Coupon Management
router.get("/coupons", isAdmin, getAllCoupons);
router.get("/coupons/:id", isAdmin, getCouponById);
router.post("/coupons", isAdmin, addCoupon);
router.put("/coupons/:id", isAdmin, updateCoupon);
router.delete("/coupons/:id", isAdmin, deleteCoupon);

// Sale Management
router.post("/sales", isAdmin, upload.array("images", 5), createSale);
router.get("/sales", isAdmin, getAllSales);
router.get("/sales/:id", isAdmin, getSaleById);
router.put("/sales/:id", isAdmin, updateSale);
router.delete("/sales/:id", isAdmin, deleteSale);

// Brand Routes (admin only)
router.post('/brands', isAdmin, createBrand);
router.get('/brands', isAdmin, getAllBrands);
router.get('/brands/:id', isAdmin, getBrandById);
router.put('/brands/:id', isAdmin, updateBrand);
router.delete('/brands/:id', isAdmin, deleteBrand);

// Refund Management
router.put("/orders/:id/refund", isAdmin, adminRefundOrder);
router.put("/security", isAdmin, updateAdminSecurity);

router.get("/dashboard", isAdmin, getAdminDashboardStats);

router.get("/analytics/weekly-trends", getWeeklyTrends);

// routes/adminRoutes.js
router.get('/notifications/count', getAdminNotificationCount);

//Notifications
router.get("/notifications/count", getAdminNotificationCount);
router.get("/notifications", getAdminNotifications);
router.put("/notifications/:id/read", markNotificationAsRead);
router.delete("/notifications/:id", isAdmin, deleteAdminNotification);

module.exports = router;


