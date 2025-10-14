const express = require('express');
const router = express.Router();
const {
  createProduct,
  getVendorAllProducts,
  deleteProduct,
  getAllProducts,
  createProductReview,
  getProductById,
  getProductsBySubSubCategory,
  updateProduct,
  getVendorSingleProduct,
} = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const { isVendor, isAuthenticated } = require('../middleware/authMiddleware');

// Configure multer to use memory storage
const storage = multer.memoryStorage();  

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    fieldSize: 25 * 1024 * 1024, // 25 MB for fields (text, etc.)
    files: 5, // Limit the number of files uploaded to 5
  },
  fileFilter: function (req, file, cb) {
    // file type validation
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png)'));
    }
  }
});


router.get('/:id', getProductById);
router.get('/', async (req, res, next) => {
  if (req.query.subSubCategory) {
    return getProductsBySubSubCategory(req, res, next); 
  }
  return getAllProducts(req, res, next);  
});


router.get('/:vendorId/products', getVendorAllProducts);
router.get("/vendor/product/:id", isVendor, getVendorSingleProduct);
router.post('/create-product',isVendor,  upload.array("images", 5), createProduct); 
router.delete('/:id', isVendor, deleteProduct);
router.put("/update-product/:id", isVendor, updateProduct); 
router.post('/reviews', isAuthenticated, createProductReview);

module.exports = router;
