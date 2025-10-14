const Brand = require('../models/brandModel');
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const expressAsyncHandler = require("express-async-handler");

// Get all brands
const getAllBrands = expressAsyncHandler(async (req, res, next) => {
  const brands = await Brand.find();
  res.status(200).json({
    success: true,
    brands,
  });
});

// Create new brand
const createBrand = expressAsyncHandler(async (req, res, next) => {
  const { name, description, logo, } = req.body;

  const brand = await Brand.create({
    name,
    description,
    logo,
  });

  res.status(201).json({
    success: true,
    brand,
  });
});

// Get single brand by ID
const getBrandById = expressAsyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    });
  }

  res.status(200).json({
    success: true,
    brand,
  });
});

// Update brand
const updateBrand = expressAsyncHandler(async (req, res, next) => {
  let brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    });
  }

  brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    brand,
  });
});

// Delete brand
const deleteBrand = expressAsyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
    });
  }

  await brand.remove();

  res.status(200).json({
    success: true,
    message: 'Brand deleted successfully',
  });
});

module.exports = {
  getAllBrands,
  createBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
};
