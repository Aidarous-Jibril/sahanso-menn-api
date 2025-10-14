// SaleController.js
const mongoose = require("mongoose");
const Vendor = require("../models/vendorModel");
const Sale = require("../models/saleModel");
const expressAsyncHandler = require("express-async-handler");
const cloudinary = require("../utils/cloudinary");
const SubCategory = require("../models/subCategory");
const SubSubCategory = require("../models/subSubCategory");
const MainCategory = require("../models/mainCategory");

// Create product
const createSale = expressAsyncHandler(async (req, res) => {
console.log("BODY ", req.body)
  const { mainCategory, subCategory, subSubCategory, vendorId } = req.body;

  try {
    const vendor = await Vendor.findById(vendorId);

    // Check if vendor exists
    if (!vendor) {
      return res.status(400).json({ message: "Vendor Id is invalid!" });
    }

    // Function to find category by ID or name (case insensitive)
    const findCategory = async (model, value) => {
      if (mongoose.Types.ObjectId.isValid(value)) {
        // Search by _id if value is a valid ObjectId
        return model.findById(value);
      } else {
        // Search by name or slug (case insensitive) if value is not an ObjectId
        return model.findOne({ slug: new RegExp(`^${value}$`, "i") });
      }
    };

    // Find categories by ID or name
    const existingMainCategory = await findCategory(MainCategory, mainCategory);
    const existingSubCategory = await findCategory(SubCategory, subCategory);
    const existingSubSubCategory = await findCategory(
      SubSubCategory,
      subSubCategory
    );

    if (
      !existingMainCategory ||
      !existingSubCategory ||
      !existingSubSubCategory
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid category, subcategory, or sub-subcategory ID or name",
        });
    }

    // Upload images to cloudinary
    const images = await uploadImages(req.body.images);
    // Create product data
    const saleData = {
      name: req.body.name,
      description: req.body.description,
      mainCategory: existingMainCategory.slug,
      subCategory: existingSubCategory.slug,
      subSubCategory: existingSubSubCategory.slug,
      brand: req.body.brand,
      model: req.body.model,
      size: req.body.size,
      color: req.body.color,
      originalPrice: req.body.originalPrice,
      discountPrice: req.body.discountPrice,
      stock: req.body.stock,
      vendorId: vendorId,
      vendor: vendor,
      saleStart: req.body.startDate || null,
      saleEnd:   req.body.endDate   || null,
      isFeatured: req.body.isFeatured,
      attributes: new Map(Object.entries(req.body.attributes)),
      images: images,
    };

    const sale = await Sale.create(saleData);

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale,
    });
  } catch (error) {
    console.error("ERROR_CREATING_Sale", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Function to upload images to cloudinary
const uploadImages = async (images) => {
  if (!Array.isArray(images)) {
    throw new Error("Images should be an array of URLs or file paths.");
  }

  const imagesLinks = [];
  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i]; // Expecting images[i] to be a string URL or file path
    if (typeof imagePath !== "string") {
      throw new Error("Each image should be a URL or file path string.");
    }

    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: "products",
      });
      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (uploadError) {
      // console.error("ERROR_UPLOADING_IMAGE", uploadError);
      throw new Error("Error uploading image to Cloudinary.");
    }
  }
  return imagesLinks;
};

// Get all Sales
const getAllSales = expressAsyncHandler(async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      sales,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
});

// Get all Sales of a store
const getAllVendorSales = expressAsyncHandler(async (req, res) => {
  try {
    const sales = await Sale.find({ vendorId: req.params.id });
    res.status(201).json({
      success: true,
      sales,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
}); 

// Get a single Sale by ID
const getSingleSale = expressAsyncHandler(async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
});

// Delete Sale of a store
const deleteSale = expressAsyncHandler(async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    throw new Error("Product not found");
  }
});

  // Update Sale
  const updateSale = expressAsyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
  
    Object.assign(sale, req.body);
    await sale.save();
  
    res.status(200).json({ message: "Sale updated successfully", sale });
  });

  // Get a single Sale for a Vendor
const getSingleSaleByVendor = expressAsyncHandler(async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Optional: Only allow vendor to view their own sale
    if (sale.vendorId.toString() !== req.vendor._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this sale" });
    }

    res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    return res.status(400).json({ message: "Error fetching sale", error: error.message });
  }
});

module.exports = {
  createSale,
  getAllVendorSales,
  getAllSales,
  getSingleSale,
  deleteSale,
  updateSale,
  getSingleSaleByVendor
};
