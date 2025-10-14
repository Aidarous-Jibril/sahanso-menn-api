const CouponCode = require("../models/couponCodeModel");
const expressAsyncHandler = require("express-async-handler");


// Create a new coupon code
const createCouponCode = expressAsyncHandler(async (req, res) => {
  try {
    const { name, value, type, validityStart, validityEnd, status, selectedProducts, vendorId } = req.body;

    // Validate fields
    if (!name || !value || !type || !validityStart || !validityEnd || !status || !selectedProducts || !vendorId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert selectedProducts to an array if it's a string
    const selectedProductsArray = Array.isArray(selectedProducts) ? selectedProducts : [selectedProducts];

    // Check if the coupon already exists for the vendor
    const isCouponCodeExists = await CouponCode.findOne({ name, vendorId });
    if (isCouponCodeExists) {
      return res.status(400).json({ message: "Coupon Code already exists!" });
    }

    const couponCode = await CouponCode.create({
      name,
      value: Number(value),
      type,
      validityStart,
      validityEnd,
      status,
      selectedProducts: selectedProductsArray,
      vendorId,
    });

    // Send a response with the created coupon and its _id
    res.status(201).json({
      success: true,
      message: "Coupon Code created successfully",
      couponCode: {
        id: couponCode._id,
        name: couponCode.name,
        value: couponCode.value,
        type: couponCode.type,
        validityStart: couponCode.validityStart,
        validityEnd: couponCode.validityEnd,
        status: couponCode.status,
        selectedProducts: couponCode.selectedProducts,
        vendorId: couponCode.vendorId,
      },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Update a coupon code
const updateCouponCode = expressAsyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, type, validityStart, validityEnd, status, selectedProducts, vendorId } = req.body;

    // Validate fields
    if (!name || !value || !type || !validityStart || !validityEnd || !status || !selectedProducts || !vendorId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert selectedProducts to an array if it's a string
    const selectedProductsArray = Array.isArray(selectedProducts) ? selectedProducts : [selectedProducts];

    // Find the coupon by ID and vendor
    const couponCode = await CouponCode.findOne({ _id: id, vendorId });
    if (!couponCode) {
      return res.status(404).json({ message: "Coupon code not found" });
    }

    // Update the coupon code
    couponCode.name = name;
    couponCode.value = Number(value);
    couponCode.type = type;
    couponCode.validityStart = validityStart;
    couponCode.validityEnd = validityEnd;
    couponCode.status = status;
    couponCode.selectedProducts = selectedProductsArray;

    // Save the updated coupon
    await couponCode.save();

    res.status(200).json({
      success: true,
      message: "Coupon code updated successfully",
      couponCode: {
        id: couponCode._id,
        name: couponCode.name,
        value: couponCode.value,
        type: couponCode.type,
        validityStart: couponCode.validityStart,
        validityEnd: couponCode.validityEnd,
        status: couponCode.status,
        selectedProducts: couponCode.selectedProducts,
        vendorId: couponCode.vendorId,
      },
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Get all coupon codes of a store
const getAllCouponCodes = expressAsyncHandler(async (req, res) => {
  try {
    const coupons = await CouponCode.find({ vendorId: req.params.vendorId });
    if (!coupons.length) {
      return res.status(404).json({ success: false, message: "No coupons found for this vendor" });
    }
    res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
});

// Delete a coupon code
const deleteCouponCode = expressAsyncHandler(async (req, res) => {
  try {
    const coupon = await CouponCode.findByIdAndDelete(req.params.id); // Directly deletes the coupon
    if (coupon) {
      res.status(200).json({
        success: true,
        message: "Coupon code deleted successfully",
        _id: coupon._id, // Include the deleted coupon ID
      });
    } else {
      res.status(404).json({ message: "Coupon code not found" });
    }
  } catch (error) {
    console.error("Error deleting coupon:", error); // Log the error for debugging
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get coupon code value by name
const getCouponCodeValue = expressAsyncHandler(async (req, res) => {
  try {
    const couponCode = await CouponCode.findOne({ name: req.params.name });
    if (couponCode) {
      res.status(200).json({
        success: true,
        couponCode,
        message: "Coupon code fetched successfully",
      });
    } else {
      res.status(404).json({ msg: "Coupon code not found!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = {
  createCouponCode,
  getAllCouponCodes,
  deleteCouponCode,
  updateCouponCode,
  getCouponCodeValue
};
