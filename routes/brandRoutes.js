const express = require('express');
const {
  getAllBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require('../controllers/brandController');

const router = express.Router();

router.route('/')
  .get(getAllBrands)
  .post(createBrand);

router.route('/:id')
  .get(getBrandById)
  .put(updateBrand)
  .delete(deleteBrand);

module.exports = router;
