const expressAsyncHandler = require("express-async-handler");
const SiteSettings = require("../models/siteSettingModel");
const cloudinary = require("../utils/cloudinary");

// Public, read-only settings (no auth)
const getPublicSiteSettings = expressAsyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
console.log("settings", settings)
  // Only expose what the storefront needs
  const payload = {
    siteName: settings.siteName || "ShopO",
    logo: settings.logo || null,
    notifications: settings.notifications || {},
    advanced: {
      maintenanceMode: !!settings.advanced?.maintenanceMode,
      maintenanceEndTime: settings.advanced?.maintenanceEndTime || null,
      adminOnlyMode: !!settings.advanced?.adminOnlyMode,
      enableErrorLogging: !!settings.advanced?.enableErrorLogging,
      defaultMetaTitle: settings.advanced?.defaultMetaTitle || "",
      defaultMetaDescription: settings.advanced?.defaultMetaDescription || "",
    },
  };

  res.status(200).json(payload);
});

// Get Site Settings
const getSiteSettings = expressAsyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  console.log('settings', settings)
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  res.status(200).json(settings);
});

// Update Site Settings
const updateSiteSettings = expressAsyncHandler(async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }

  const { siteName, siteDescription, contactEmail, supportPhone } = req.body;
  if (siteName !== undefined) settings.siteName = siteName;
  if (siteDescription !== undefined) settings.siteDescription = siteDescription;
  if (contactEmail !== undefined) settings.contactEmail = contactEmail;
  if (supportPhone !== undefined) settings.supportPhone = supportPhone;


  
  // Handle notifications (JSON string from frontend)
  if (req.body.notifications) {
    try {
      const incoming =
        typeof req.body.notifications === "string"
          ? JSON.parse(req.body.notifications)
          : req.body.notifications;

      settings.notifications = {
        ...settings.notifications,
        ...incoming,
      };
    } catch (error) {
      console.error("Failed to parse notifications:", error);
    }
  }

  //For advance site setting 
  if (req.body.advanced) {
    try {
      const parsed =
        typeof req.body.advanced === "string"
          ? JSON.parse(req.body.advanced)
          : req.body.advanced;

      // Parse maintenanceEndTime safely
      if (parsed.maintenanceEndTime) {
        parsed.maintenanceEndTime = new Date(parsed.maintenanceEndTime);
      }
      
      settings.advanced = {
        ...settings.advanced,
        ...parsed,
      };
    } catch (error) {
      console.error("Failed to parse advanced settings:", error);
    }
  }
  // If a new logo file is uploaded via multer, req.file will exist.
  if (req.file) {
    try {
      // If there's an existing logo, delete it from Cloudinary.
      if (settings.logo && settings.logo.public_id) {
        await cloudinary.uploader.destroy(settings.logo.public_id);
      }
      // Use Cloudinary's upload_stream to upload the new logo.
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "site_logos", format: "png" },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);
      settings.logo = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      const updatedSettings = await settings.save();
      return res.status(200).json({
        success: true,
        message: "Site settings updated successfully",
        settings: updatedSettings,
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      return res.status(500).json({ message: "Logo upload failed", error: error.message });
    }
  }
  // If no file is uploaded but a logo object is sent in the JSON body.
  else if (req.body.logo && typeof req.body.logo === "object") {
    settings.logo = req.body.logo;
  }

  const updatedSettings = await settings.save();
  return res.status(200).json({
    success: true,
    message: "Site settings updated successfully",
    settings: updatedSettings,
  });
});

module.exports = {
  getPublicSiteSettings,
  getSiteSettings,
  updateSiteSettings,
};
