const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "My E-Commerce Site" },
    siteDescription: {
      type: String,
      default: "Discover quality products from multiple trusted vendors in one convenient marketplace.",
    },
    logo: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    defaultCurrency: { type: String, default: "USD" },
    contactEmail: { type: String, default: "support@example.com" },
    supportPhone: { type: String, default: "+46720040449" },

    notifications: {
      newUserRegistered: { type: Boolean, default: true },
      newVendorRegistered: { type: Boolean, default: true },
      newOrderPlaced: { type: Boolean, default: true },
      refundRequested: { type: Boolean, default: true },
      productReviewSubmitted: { type: Boolean, default: true },
    },  
    advanced: {
      maintenanceMode: { type: Boolean, default: false },
      defaultMetaTitle: { type: String, default: "ShopQ - All You Need" },
      defaultMetaDescription: { type: String, default: "Your go-to multivendor marketplace for everything from fashion to electronics." },
      enableErrorLogging: { type: Boolean, default: true },
      adminOnlyMode: { type: Boolean, default: false },
      maintenanceEndTime: { type: Date },
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
