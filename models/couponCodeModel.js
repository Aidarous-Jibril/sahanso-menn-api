//couponCodeModel.js
const mongoose = require("mongoose");

const couponCodeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your coupon code name!"],
        unique: true,
        trim: true,
    },
    value: {
        type: Number,
        required: true,
        min: [0, "Value must be a positive number"],
    },
    type: {
        type: String,  
        required: true,
    },
    validityStart: {
        type: Date,
        required: true,
    },
    validityEnd: {
        type: Date,
        required: true,
    },
    status: {
        type: String,  
        required: true,
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
    },
    selectedProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model("CouponCode", couponCodeSchema);
