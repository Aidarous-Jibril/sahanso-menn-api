const ErrorHandler = require('../utils/errorHandler');
const jwt = require('jsonwebtoken')
const expressAsyncHandler = require("express-async-handler");
const User = require('../models/userModel')
const Vendor = require('../models/vendorModel')
const Admin = require('../models/adminModel');


const isAuthenticated = expressAsyncHandler(async (req, res, next) => {
  const { user_token } = req.cookies;

  if (!user_token) {
    return res.status(401).json({
      message: "Please sign in to add a shipping address.",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const decoded = jwt.verify(user_token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Session expired. Please login again.", 401));
    }
    return next(new ErrorHandler("Authentication failed.", 401));
  }
});

// Vendor Authentication
const isVendor = expressAsyncHandler(async (req, res, next) => {
  // 1) Try cookie first
  let token = req.cookies?.vendor_token;

  // 2) Fallback to Authorization: Bearer <token>
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Vendor not authenticated. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findById(decoded.id).select("-password");
    if (!vendor) {
      return res.status(401).json({ error: "Vendor not found or session expired." });
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("Token error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
  }
});

// Admin Authentication
const isAdmin = expressAsyncHandler(async (req, res, next) => {
  const token = req.cookies.admin_token || req.headers.authorization?.split(" ")[1];
  if (!token) return next(new ErrorHandler("Admin session required", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return next(new ErrorHandler("Admin not found", 404));
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ErrorHandler("Admin session expired", 401));
    }
    return next(new ErrorHandler("Invalid admin token", 401));
  }
});

module.exports = { isAuthenticated, isVendor, isAdmin }
