const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createSale, getAllVendorSales, getAllSales, getSingleSale, deleteSale, updateSale, getSingleSaleByVendor } = require('../controllers/saleController');
const { isVendor } = require('../middleware/authMiddleware');

// Multer configuration
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage, limits: { fieldSize: 25 * 1024 * 1024 } });


router.post('/create-sale', isVendor, upload.array("images"), createSale);
router.get('/vendor/:id', isVendor, getAllVendorSales); 
router.get('/', getAllSales);
router.get('/:id', getSingleSale); 
router.delete('/sale/:id', isVendor, deleteSale); 
router.put('/sale/:id', isVendor, updateSale);
router.get('/vendor-sale/:id', isVendor, getSingleSaleByVendor); 


module.exports = router;
