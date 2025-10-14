const mongoose = require("mongoose");

const vendorNotificationSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["new_order", "refund_request", "product_review"],
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorNotification", vendorNotificationSchema);
