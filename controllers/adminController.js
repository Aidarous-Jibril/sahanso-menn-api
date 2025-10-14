const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail");
const mongoose = require("mongoose");
const createAdminToken = require("../utils/adminToken");

const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Vendor = require("../models/vendorModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Sale = require("../models/saleModel");
const Brand = require('../models/brandModel');
const MainCategory = require("../models/mainCategory");
const SubCategory = require('../models/subCategory');
const SubSubCategory = require('../models/subSubCategory');
const CouponCode = require("../models/couponCodeModel");
const Notification = require("../models/notificationModel");


// Admin Registration
const registerAdmin = expressAsyncHandler(async (req, res) => {
  const { name, email, password, phoneNumber, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email, and password" });
  }

  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  let avatarData = {};
  if (avatar) {
    try {
      const result = await cloudinary.uploader.upload(avatar, {
        folder: 'admin_avatars',
        format: 'png',
      });
      avatarData = { url: result.secure_url, public_id: result.public_id };
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new Error('Avatar upload failed');
    }
  }

  // Create new admin
  const admin = await Admin.create({
    name,
    email,
    password,
    phoneNumber,
    avatar: avatarData,
  });
    // Generate JWT token
    const token = createAdminToken(res, admin._id);
  if (admin) {
    res.status(201).json({
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
        avatar: admin.avatar,
        token
      },
      message: 'Admin registered successfully',
    });
  } else {
    res.status(400);
    throw new Error('Invalid admin data');
  }
});

// Admin Login
const loginAdmin = expressAsyncHandler(async (req, res) => {
  console.log("req", req.body)
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    createAdminToken(res, admin._id); 
  
    res.json({
      message: "Admin logged in successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Forgot Password
const forgotPasswordAdmin = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(404).json({ error: "Admin not found" });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  admin.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  admin.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await admin.save();

  const resetUrl = `http://localhost:3000/admin/reset-password/${resetToken}`;
  const message = `You requested a password reset. Click to reset: ${resetUrl}`;

  await sendEmail({
    to: admin.email,
    subject: "Admin Password Reset",
    text: message,
  });

  res.status(200).json({ message: "Password reset email sent to admin" });
});

// Admin Reset Password
const resetPasswordAdmin = expressAsyncHandler(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!admin) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const salt = await bcrypt.genSalt(10);
  admin.password = await bcrypt.hash(newPassword, salt);

  admin.password = newPassword;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpire = undefined;
  await admin.save();

  res.status(200).json({ message: "Admin password reset successful" });
});

// Get Admin Profile
const getAdminProfile = expressAsyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select("-password"); 
  if (admin) {
    res.status(200).json({ success: true, admin });
  } else {
    return res.status(404).json({ message: "Admin not found" });
  }
});

// Update Admin Profile
const updateAdminProfile = expressAsyncHandler(async (req, res) => {
  // Assuming req.admin._id is set by an authentication middleware
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
    
  // Update allowed fields
  admin.name = req.body.name || admin.name;
  admin.email = req.body.email || admin.email;
  admin.phoneNumber = req.body.phoneNumber || admin.phoneNumber;

  // Update avatar if provided
  if (req.body.avatar) {
    try {
      const result = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "admin_avatars",
        format: "png",
      });
      admin.avatar = { url: result.secure_url, public_id: result.public_id };
    } catch (err) {
      return res.status(500).json({ message: "Avatar upload failed", error: err.message });
    }
  }

  // Update password if provided (you may want to require the current password in a real app)
  if (req.body.password) {
    // Hash the new password
    admin.password = await bcrypt.hash(req.body.password, 10);
  }

  const updatedAdmin = await admin.save();
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    admin: updatedAdmin,
  });
});

const logoutAdmin = (req, res) => {
  res.clearCookie("admin_token");
  res.status(200).json({ message: "Logged out successfully" });
};

// ---------- USER MANAGEMENT ----------
// Get all users
const getAllUsers = expressAsyncHandler(async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

// Get single user by ID
const getUserById = expressAsyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
});

// Edit user details
const updateUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  Object.assign(user, req.body);
  const updatedUser = await user.save();

  res.json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});

// Delete user
const deleteUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await user.deleteOne(); // or user.remove()
  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// ---------- VENDOR MANAGEMENT ----------
// Get all vendors
const getAllVendors = expressAsyncHandler(async (req, res) => {
  const vendors = await Vendor.find();
  return res.status(200).json({ success: true, vendors });
});

// Get single vendor by ID
const getVendorById = expressAsyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" , vendor});
  }
  return res.status(200).json({ success: true, vendor });
});

// Update vendor details
const updateVendor = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, address, zipCode, avatar } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }

  vendor.name = name || vendor.name;
  vendor.email = email || vendor.email;
  vendor.phoneNumber = phoneNumber || vendor.phoneNumber;
  vendor.address = address || vendor.address;
  vendor.zipCode = zipCode || vendor.zipCode;
  vendor.avatar = avatar || vendor.avatar;

  try {
    await vendor.save();
    return res.status(200).json({ success: true, message: "Vendor updated successfully", vendor });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update vendor" });
  }
});

// Delete vendor
const deleteVendor = expressAsyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }
  return res.status(200).json({ success: true, message: "Vendor deleted successfully" });
});

// Block vendor
const blockVendor = expressAsyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }
  vendor.isBlocked = true;
  await vendor.save();
  return res.status(200).json({ success: true, message: "Vendor blocked successfully", vendor });
});

// Unblock vendor
const unblockVendor = expressAsyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: "Vendor not found" });
  }
  vendor.isBlocked = false;
  await vendor.save();
  return res.status(200).json({ success: true, message: "Vendor unblocked successfully", vendor });
});

// ---------- ORDER MANAGEMENT ----------
// Get all orders
const getAllOrders = expressAsyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user")
    .populate("items.productId");

  return res.status(200).json({ success: true, orders });
});

// Get single order by ID
const getOrderById = expressAsyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user")
    .populate("items.productId");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.status(200).json({ success: true, order });
});

// Delete order
const deleteOrder = expressAsyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.status(200).json({ success: true, message: "Order deleted successfully" });
});

// update the order status
const updateOrderStatus = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = status || order.status;
  await order.save();

  // Format status for readability
  const statusFormatted = status
  ?.replace(/_/g, " ")
  ?.replace(/\b\w/g, (char) => char.toUpperCase()); 

  return res.status(200).json({
    success: true,
    message: `Order status updated to "${statusFormatted}"`,
    order,
  });
});

// Update full order
const updateOrder = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, shippingAddress, paymentInfo, totalAmount } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = status || order.status;
  order.shippingAddress = shippingAddress || order.shippingAddress;
  order.paymentInfo = paymentInfo || order.paymentInfo;
  order.totalPrice = totalAmount || order.totalPrice;

  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order updated successfully",
    order,
  });
});

// Process refund
const refundOrder = expressAsyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.isRefunded) {
    return res.status(400).json({ message: "Order is already refunded" });
  }

  order.isRefunded = true;
  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order refunded successfully",
    order,
  });
});

// New function to get orders by user ID
const getUserOrders = expressAsyncHandler(async (req, res) => {
    const userId = req.params.userId;

    const orders = await Order.find({ user: userId })
      .populate("user")
      .populate("items.productId");

    return res.status(200).json({ success: true, orders });
});

// ---------- PRODUCT MANAGEMENT ----------
// Admin creates a product; admin selects vendor from a dropdown (vendorId)
const uploadImages = require("../utils/uploadImages");
const createProduct = expressAsyncHandler(async (req, res) => {
  try {
    const {
      name,
      description,
      mainCategory,
      subCategory,
      subSubCategory,
      brand,
      originalPrice,
      discountPrice,
      stock,
      vendorId,
      isFeatured,
      attributes,
    } = req.body;

    // Validate required fields
    if (!name || !description || !mainCategory || !subCategory || !subSubCategory || stock == null || discountPrice == null || !vendorId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Validate vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(400).json({ message: "Invalid vendor ID" });

    // Handle categories
    const findCategory = async (model, value) => {
      return mongoose.Types.ObjectId.isValid(value)
        ? model.findById(value)
        : model.findOne({ slug: new RegExp(`^${value}$`, "i") });
    };
    const existingMainCategory = await findCategory(MainCategory, mainCategory);
    const existingSubCategory = await findCategory(SubCategory, subCategory);
    const existingSubSubCategory = await findCategory(SubSubCategory, subSubCategory);

    if (!existingMainCategory || !existingSubCategory || !existingSubSubCategory) {
      return res.status(400).json({ message: "Invalid category provided" });
    }

    // Handle image uploads
    let uploadedImages = [];

    // 1. If files uploaded via FormData
    if (req.files?.length > 0) {
      const imagesBase64 = req.files.map((file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
      );
      uploadedImages = await uploadImages(imagesBase64); // [{url, public_id}]
    }

    // 2. If JSON body contains image URLs (as string or array)
    else if (req.body.images) {
      let rawImages = req.body.images;

      if (typeof rawImages === "string") {
        try {
          rawImages = JSON.parse(rawImages); // Handle stringified array
        } catch (err) {
          return res.status(400).json({ message: "Invalid image format." });
        }
      }

      if (Array.isArray(rawImages)) {
        uploadedImages = rawImages.map((url) => ({ url }));
      }
    }

    // Parse attributes (if stringified JSON)
    const parsedAttributes = typeof attributes === "string" ? JSON.parse(attributes) : attributes;

    // Construct product data
    const productData = {
      name,
      description,
      mainCategory: existingMainCategory.slug,
      subCategory: existingSubCategory.slug,
      subSubCategory: existingSubSubCategory.slug,
      brand: brand || "",
      originalPrice: originalPrice || 0,
      discountPrice,
      stock,
      vendorId,
      isFeatured: isFeatured === "true" || isFeatured === true,
      images: uploadedImages,
      attributes: new Map(Object.entries(parsedAttributes || {})),
      vendor: {
        name: vendor.name,
        avatar: vendor.avatar,
        createdAt: vendor.createdAt,
        address: vendor.address,
        phoneNumber: vendor.phoneNumber,
        email: vendor.email,
        zipCode: vendor.zipCode,
        reviews: vendor.reviews,
      },
    };

    const createdProduct = await Product.create(productData);

    res.status(201).json({
      message: "Product created successfully",
      product: createdProduct,
    });

  } catch (error) {
    console.error("❌ createProduct error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET All Products
const getAllProducts = expressAsyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// GET Single Product
const getProductById = expressAsyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("vendorId")
    .populate("reviews.user", "name email");

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.status(200).json({ success: true, product });
});

// ---------- UPDATE PRODUCT ----------
const editProduct = expressAsyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  Object.assign(product, req.body);
  await product.save();

  res.json({ message: "Product updated successfully", product });
});

// Delete product
const deleteProduct = expressAsyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted successfully" });
});

// ---------- MAIN-CATEGORY MANAGEMENT ----------
// Get all categories
const getAllCategories = expressAsyncHandler(async (req, res) => {
  try {
    const categories = await MainCategory.find().populate({
      path: "subcategories",
      populate: { path: "subsubcategories" },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Add new category
const addCategory = expressAsyncHandler(async (req, res) => {
  try {
    const { name, slug, imageUrl } = req.body;

    const existingCategory = await MainCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new MainCategory({ name, slug, imageUrl });
    await category.save();

    res.status(201).json({ message: "Category added successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to add category" });
  }
});

// Delete category
const getCategoryById = expressAsyncHandler(async (req, res) => {
  try {
    const category = await MainCategory.findById(req.params.id).populate("subcategories");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category" });
  }
});

// Edit category
const editCategory = expressAsyncHandler(async (req, res) => {
  try {
    const category = await MainCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = req.body.name || category.name;
    category.slug = req.body.slug || category.slug;
    category.imageUrl = req.body.imageUrl || category.imageUrl;

    await category.save();

    res.status(200).json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Failed to update category" });
  }
});

// Delete category
const deleteCategory = expressAsyncHandler(async (req, res) => {
  try {
    const category = await MainCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});


// ---------- SUBCATEGORY MANAGEMENT ----------
// Get SubCategories by Main Category ID or all subcategories
const getAllSubCategories =  expressAsyncHandler(async (req, res) => {
    try {
        const { mainCategoryId } = req.query;  
        let subcategories = [];

        if (mainCategoryId) {
            const mainCategory = await MainCategory.findById(mainCategoryId);

            if (!mainCategory) {
              return res.status(404).json({ message: "Main category not found" });
            }

            subcategories = await SubCategory.find({ mainCategory: mainCategory._id })
                .populate({ path: 'mainCategory', select: 'name slug imageUrl' }) 
                .populate('subsubcategories');  
        } else {
            subcategories = await SubCategory.find()
            .populate({ path: 'mainCategory', select: 'name slug imageUrl' })
            .populate('subsubcategories');
        }

        res.status(200).json({ subcategories, message: "Subcategories fetched successfully!" });
    } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ message: "Failed to fetch subcategories" });
    }
});

// Add a new subcategory
const createSubCategory = expressAsyncHandler(async (req, res) => {
  const { name, slug, imageUrl, mainCategory } = req.body;

  const exists = await SubCategory.findOne({ slug });
  if (exists) return res.status(400).json({ message: "Subcategory already exists" });

  const createdsubCat = await SubCategory.create({ name, slug, imageUrl, mainCategory });

  // maintain relation on main category
  await MainCategory.findByIdAndUpdate(mainCategory, { $push: { subcategories: createdsubCat._id } });

  const populated = await SubCategory.findById(createdsubCat._id)
    .populate({ path: "mainCategory", select: "name slug imageUrl" })
    .populate("subsubcategories");

  res.status(201).json({ message: "Subcategory added successfully", subCategory: populated });
});

// Get Single SubCategory
const getSubCategoryById = expressAsyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id).populate("mainCategory").populate("subsubcategories");

    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.status(200).json(subCategory);
});

// Update subcategory
const updateSubCategory = expressAsyncHandler(async (req, res) => {
  const id = req.params.id;
  const sub = await SubCategory.findById(id);
  if (!sub) return res.status(404).json({ message: "Subcategory not found" });

  sub.name = req.body.name ?? sub.name;
  sub.slug = req.body.slug ?? sub.slug;
  sub.imageUrl = req.body.imageUrl ?? sub.imageUrl;
  sub.mainCategory = req.body.mainCategory ?? sub.mainCategory;
  await sub.save();

  const populated = await SubCategory.findById(sub._id)
    .populate({ path: "mainCategory", select: "name slug imageUrl" })
    .populate("subsubcategories");

  res.status(200).json({ message: "Subcategory updated successfully", subCategory: populated });
});

// Delete subcategory
const deleteSubCategory = expressAsyncHandler(async (req, res) => {
    const subCategoryId = req.params.id;
    const subCategory = await SubCategory.findByIdAndDelete(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    //Remove subCategory reference from SubCategory
    await MainCategory.findByIdAndUpdate(subCategory.mainCategory, { $pull: { subcategories: subCategory._id } });
    
    res.status(200).json({
      message: "Subcategory deleted successfully",
      subCategoryId: subCategory._id,
    });
  });

// ---------- SUB-SUBCATEGORY MANAGEMENT ----------
// Get all sub-subcategories
const getAllSubSubCategories = expressAsyncHandler(async (req, res) => {
    try {
        const { subCategoryId } = req.query;  
        let subSubcategories = [];
        if (subCategoryId) {
            const subCategory = await SubCategory.findById(subCategoryId);

            if (!subCategory) {
              return res.status(404).json({ message: "Subcategory not found" });
            }

            subSubcategories = await SubSubCategory.find({ subCategory: subCategory._id })
              .populate({ path: 'subCategory', select: 'name slug imageUrl mainCategory' })
        } else {
            subSubcategories = await SubSubCategory.find().populate('subCategory');
        }

        res.status(200).json({ subSubcategories, message: 'Sub-subcategories fetched successfully!' });
    } catch (error) {
        console.error('Error fetching sub-subcategories:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Create sub-subcategory
const createSubSubCategory = expressAsyncHandler(async (req, res) => {
  const { name, slug, imageUrl, subCategory } = req.body;

  const createdSubSubCat = await SubSubCategory.create({ name, slug, imageUrl, subCategory });
  await SubCategory.findByIdAndUpdate(subCategory, { $push: { subsubcategories: createdSubSubCat._id } });

  const populated = await SubSubCategory.findById(createdSubSubCat._id)
    .populate({ path: "subCategory", select: "name slug imageUrl mainCategory" });

  res.status(201).json({ message: "SubSubCategory created successfully", subSubCategory: populated });
});

// Get Single Sub-SubCategory
const getSubSubCategoryById = expressAsyncHandler(async (req, res) => {
    const subSubCategory = await SubSubCategory.findById(req.params.id).populate("subCategory");

    if (!subSubCategory) {
      return res.status(404).json({ message: "Sub-subcategory not found" });
    }
  
    res.status(200).json(subSubCategory);
});

// Update sub-subcategory
const updateSubSubCategory = expressAsyncHandler(async (req, res) => {
  const id = req.params.id;
  const ssc = await SubSubCategory.findById(id);
  if (!ssc) return res.status(404).json({ message: "Sub-subcategory not found" });

  ssc.name = req.body.name ?? ssc.name;
  ssc.slug = req.body.slug ?? ssc.slug;
  ssc.imageUrl = req.body.imageUrl ?? ssc.imageUrl;
  ssc.subCategory = req.body.subCategory ?? ssc.subCategory;
  await ssc.save();

  const populated = await SubSubCategory.findById(ssc._id)
    .populate({ path: "subCategory", select: "name slug imageUrl mainCategory" });

  res.status(200).json({ message: "Sub-subcategory updated successfully", subSubCategory: populated });
});
  
// Delete sub-subcategory
const deleteSubSubCategory = expressAsyncHandler(async (req, res) => {
    const subSubCategoryId = req.params.id;
    const subSubCategory = await SubSubCategory.findByIdAndDelete(subSubCategoryId);

    if (!subSubCategory) {
      return res.status(404).json({ message: "Sub-subcategory not found" });
    }
    // Remove SubSubCategory reference from SubCategory
    await SubCategory.findByIdAndUpdate(subSubCategory.subCategory, { $pull: { subsubcategories: subSubCategory._id } });

    res.status(200).json({
        message: "Sub-subcategory deleted successfully",
        subSubCategoryId: subSubCategory._id
    });
  });

// ---------- COUPON MANAGEMENT ----------
// Get all coupons
const getAllCoupons = expressAsyncHandler(async (req, res) => {
    const coupons = await CouponCode.find()
      .populate("vendorId")
      .populate("selectedProducts");
      res.status(200).json({
        message: "Coupons fetched successfully",
        coupons,
      });
});

// Get single coupon by ID
const getCouponById = expressAsyncHandler(async (req, res) => {
    const coupon = await CouponCode.findById(req.params.id)
      .populate("vendorId")
      .populate("selectedProducts");

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
  
    res.status(200).json(coupon);
});

// Add a new coupon
const addCoupon = expressAsyncHandler(async (req, res) => {
    const { code, discount, type, validityStart, validityEnd, status, vendorId } = req.body;

    const existingCoupon = await CouponCode.findOne({ name: code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = new CouponCode({
        name: code,  
        value: discount, 
        type,
        validityStart,
        validityEnd,
        status,
        vendorId,  // Use the admin's vendor ID
    });

    await coupon.save();
    res.status(201).json({ message: "Coupon added successfully", coupon });
});

// Edit coupon
const updateCoupon = expressAsyncHandler(async (req, res) => {
    const coupon = await CouponCode.findById(req.params.id)
      .populate("vendorId")
      .populate("selectedProducts");

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

  coupon.name = req.body.name || coupon.name;
  coupon.status = req.body.status ?? coupon.status;
  coupon.value = req.body.value ?? coupon.value;
  coupon.type = req.body.type || coupon.type;
  coupon.validityStart = req.body.validityStart || coupon.validityStart;
  coupon.validityEnd = req.body.validityEnd || coupon.validityEnd;

  const updatedCoupon = await coupon.save();

    return res.status(200).json({ message: "Coupon updated successfully", coupon: updatedCoupon });
  });
  
// Delete coupon
const deleteCoupon = expressAsyncHandler(async (req, res) => {
    const coupon = await CouponCode.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
  
    res.status(200).json({ message: "Coupon deleted successfully" });
});

// ---------- SALES MANAGEMENT ----------
const createSale = expressAsyncHandler(async (req, res) => {
  const {
    name,
    description,
    mainCategory,
    subCategory,
    subSubCategory,
    brand,
    originalPrice,
    discountPrice,
    stock,
    vendorId,
    saleStart,
    saleEnd,
    isFeatured,
    attributes,
  } = req.body;

  if (
    !name || !description || !mainCategory || !subCategory ||
    !subSubCategory || stock == null || discountPrice == null || !vendorId
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) return res.status(400).json({ message: "Invalid vendor ID" });

  const findCategory = async (model, value) => {
    return mongoose.Types.ObjectId.isValid(value)
      ? model.findById(value)
      : model.findOne({ slug: new RegExp(`^${value}$`, "i") });
  };

  const existingMainCategory = await findCategory(MainCategory, mainCategory);
  const existingSubCategory = await findCategory(SubCategory, subCategory);
  const existingSubSubCategory = await findCategory(SubSubCategory, subSubCategory);

  if (!existingMainCategory || !existingSubCategory || !existingSubSubCategory) {
    return res.status(400).json({ message: "Invalid category references" });
  }

  // Handle image upload
  let uploadedImages = [];
  if (req.files?.length > 0) {
    const imagesBase64 = req.files.map((file) =>
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    );
    uploadedImages = await uploadImages(imagesBase64);
  }

  const parsedAttributes = attributes ? JSON.parse(attributes) : {};

  const sale = await Sale.create({
    name,
    description,
    brand: brand || "",
    mainCategory: existingMainCategory.slug,
    subCategory: existingSubCategory.slug,
    subSubCategory: existingSubSubCategory.slug,
    originalPrice: originalPrice || 0,
    discountPrice,
    stock,
    saleStart,
    saleEnd,
    isFeatured: isFeatured || false,
    vendorId,
    images: uploadedImages,
    attributes: new Map(Object.entries(parsedAttributes)),
    vendor: {
      name: vendor.name,
      avatar: vendor.avatar,
      createdAt: vendor.createdAt,
      address: vendor.address,
      phoneNumber: vendor.phoneNumber,
      email: vendor.email,
      zipCode: vendor.zipCode,
      reviews: vendor.reviews,
    },
  });

  res.status(201).json({
    message: "Sale created successfully",
    sale,
  });
});

  // Get All Sales
  const getAllSales = expressAsyncHandler(async (req, res) => {
    const sales = await Sale.find();
    res.status(200).json({
      message: "Sales fetched successfully",
      sales,
    });
  });
  
  // Get Single Sale
  const getSaleById = expressAsyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    res.status(200).json(sale);
  });
  
  // Update Sale
  const updateSale = expressAsyncHandler(async (req, res) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
  
    Object.assign(sale, req.body);
    await sale.save();
  
    let message = "Sale updated successfully";

    if (req.body.status) {
      const statusFormatted = req.body.status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  
      message = `Sale status updated to "${statusFormatted}"`;
    }
  
    res.status(200).json({ message, sale });
  });
  
  // Delete Sale
  const deleteSale = expressAsyncHandler(async (req, res) => {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
  
    res.status(200).json({ message: "Sale deleted successfully" });
  });

  
// @desc    Create a new brand
// @route   POST /api/admin/brands
const createBrand = expressAsyncHandler(async (req, res) => {
  const { name, description, logo } = req.body;

  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    return res.status(400).json({ message: 'Brand already exists' });
  }

  const brand = await Brand.create({ name, description, logo });
  res.status(201).json({ success: true, brand });
});

// @desc    Get all brands
// @route   GET /api/admin/brands
const getAllBrands = expressAsyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, brands });
});

// @desc    Get single brand by ID
// @route   GET /api/admin/brands/:id
const getBrandById = expressAsyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }
  res.status(200).json({ success: true, brand });
});

// @desc    Update brand
// @route   PUT /api/admin/brands/:id
const updateBrand = expressAsyncHandler(async (req, res) => {
  const { name, description, logo } = req.body;

  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }

  brand.name = name || brand.name;
  brand.description = description || brand.description;
  brand.logo = logo || brand.logo;

  const updatedBrand = await brand.save();
  res.status(200).json({ success: true, brand: updatedBrand });
});

// @desc    Delete brand
// @route   DELETE /api/admin/brands/:id
const deleteBrand = expressAsyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }

  await brand.deleteOne();
  res.status(200).json({ success: true, message: 'Brand deleted successfully' });
});


// ---------- REFUND ORDER MANAGEMENT ----------
const adminRefundOrder = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;       // Order ID
  const { status } = req.body;     // "refund_approved" | "refund_rejected"

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status !== "Processing refund") {
    return res.status(400).json({
      message: `Cannot change refund status from ${order.status} to ${status}.`,
    });
  }

  if (status === "refund_approved") {
    order.status = "refund_approved";
    // Optionally trigger refund logic via payment provider here
  } else if (status === "refund_rejected") {
    order.status = "refund_rejected";
  } else {
    return res.status(400).json({ message: "Invalid refund status" });
  }

  await order.save();

  res.status(200).json({
    message: `Order ${status.replace("_", " ")} successfully`,
    order,
  });
});


// Update Admin Security (e.g., password update)
const updateAdminSecurity = expressAsyncHandler(async (req, res) => {
  //  req.admin._id is populated via auth middleware
  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  
  const { currentPassword, newPassword } = req.body;
  // console.log(currentPassword, newPassword)
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Please provide current and new passwords" });
  }
  
  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  // Hash new password and update
  // admin.password = await bcrypt.hash(newPassword, 10);
   admin.password = newPassword; 
  const updatedAdmin = await admin.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
    admin: updatedAdmin,
  }); 
// const testPassword = "Test1234!"; // or "Test1234!" or anything else
// const hashedPassword = "$2a$10$adve9WAn3JXEK8jHjJk91OajURQpl7CQgTtJooMaLbsK5X4O31D8y";

// bcrypt.compare(testPassword, hashedPassword).then((result) => {
//   console.log("Match result:", result); // true or false
// });
});

const getAdminDashboardStats = expressAsyncHandler(async (req, res) => {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await Order.find({});

  const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayOrders = orders.filter(
    order => new Date(order.createdAt) >= yesterday && new Date(order.createdAt) < today
  );

  const deliveredOrders = orders.filter(order => order.status === "delivered").length;
  const pendingOrders = orders.filter(order => order.status === "processing").length;
  const canceledOrders = orders.filter(order => order.status === "cancelled").length;

  const todaySales = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const thisMonthSales = orders
    .filter(order => new Date(order.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const allTimeSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgOrderValue = orders.length ? (allTimeSales / orders.length).toFixed(2) : 0;

  // 1. Get valid product IDs
  const validProductIds = await Product.find().distinct("_id");
  const validProductIdSet = new Set(validProductIds.map(id => id.toString()));

  // 2. Build product count map from order items
  const productCountMap = {};
  for (const order of orders) {
    for (const item of order.items) {
      const productIdStr = item.productId?.toString();
      if (productIdStr && validProductIdSet.has(productIdStr)) {
        productCountMap[productIdStr] = (productCountMap[productIdStr] || 0) + item.quantity;
      } else {
        console.warn("⚠️ Skipping invalid or deleted productId:", productIdStr);
      }
    }
  }


  // 3. Find best-selling product ID
  let bestProductId = null;
  let maxCount = 0;

  for (const id in productCountMap) {
    if (productCountMap[id] > maxCount) {
      bestProductId = id;
      maxCount = productCountMap[id];
    }
  }


  // 4. Fetch product details
  let bestSellingProductName = "N/A";
  if (bestProductId) {
    const product = await Product.findById(bestProductId).select("name");
    if (product) {
      bestSellingProductName = product.name;
    } else {
      console.warn("⚠️ Product ID found in orders but not in DB:", bestProductId);
    }
  }

  // 5. Final response
  res.status(200).json({
    ordersToday: todayOrders.length,
    deliveredOrders,
    pendingOrders,
    canceledOrders,
    todaySales,
    yesterdaySales,
    thisMonthSales,
    allTimeSales,
    avgOrderValue,
    bestSellingProduct: bestSellingProductName
  });
});

// Weekly sales & orders trend
const getWeeklyTrends = expressAsyncHandler(async (req, res) => {
  const today = new Date();
  const last7Days = [];

  // Generate date range for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD
    last7Days.push(formatted);
  }

  const trends = await Promise.all(
    last7Days.map(async (dateStr) => {
      const start = new Date(dateStr);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const orders = await Order.find({
        createdAt: { $gte: start, $lt: end },
      });

      const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
      return {
        date: dateStr,
        orders: orders.length,
        sales: totalSales,
      };
    })
  );

  res.status(200).json({ trends });
});


const getAdminNotificationCount = expressAsyncHandler(async (req, res) => {
  // Count only unread notifications (if you track `isRead` or similar)
  const count = await Notification.countDocuments({ isRead: false });

  res.status(200).json({ count });
});

const getAdminNotifications = expressAsyncHandler(async (req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20); // show latest 20
  res.status(200).json(notifications);
});

const markNotificationAsRead = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  await Notification.findByIdAndUpdate(id, { isRead: true });
  res.status(200).json({ message: "Marked as read" });
});

// Delete an admin notification
const deleteAdminNotification = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await Notification.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.status(200).json({ message: "Notification deleted successfully" });
});


module.exports = { 
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
    getAllOrders,
    getOrderById,
    deleteOrder,
    updateOrderStatus,
    updateOrder,
    refundOrder,
    getUserOrders,
    createProduct,
    getAllProducts,
    getProductById,
    // approveProduct,
    editProduct,
    deleteProduct,
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
    getAllSales,
    getSaleById,
    createSale,
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
    deleteAdminNotification
};