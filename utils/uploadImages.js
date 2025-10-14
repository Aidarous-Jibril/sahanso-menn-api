// utils/uploadImages.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");
const cloudinary = require("./cloudinary"); // Adjust the path if needed

const uploadImages = async (images) => {
  console.log("IMAGES:", images);

  if (!Array.isArray(images)) {
    throw new Error("Images should be an array of URLs, file paths, or Base64 strings.");
  }

  const imagesLinks = [];
  const allowedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".tiff"];

  for (let i = 0; i < images.length; i++) {
    let imagePath = images[i];

    // If imagePath is an object with a url property, use that.
    if (typeof imagePath === "object" && imagePath.url) {
      imagePath = imagePath.url;
    }

    if (typeof imagePath !== "string") {
      throw new Error("Each image should be a URL or file path string.");
    }

    // 1) Remote URL
    if (imagePath.startsWith("http")) {
      try {
        const response = await axios.get(imagePath, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data, "binary");

        const resizedImagePath = `uploads/resized-${Date.now()}-${i}.png`;
        await sharp(buffer)
          .resize(1600, 1600, { fit: "inside" })
          .png({ quality: 80 })
          .toFile(resizedImagePath);

        const result = await cloudinary.uploader.upload(resizedImagePath, {
          folder: "products",
          background_removal: "cloudinary_ai",
          format: "png",
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        fs.unlinkSync(resizedImagePath);
        continue;
      } catch (error) {
        console.error("Error processing remote image", error);
        throw new Error("Error processing remote image for Cloudinary upload.");
      }
    }

    // 2) Base64 image
    if (imagePath.startsWith("data:image")) {
      const base64Data = imagePath.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      try {
        const resizedImagePath = `uploads/resized-${Date.now()}-${i}.png`;
        await sharp(buffer)
          .resize(1600, 1600)
          .png({ quality: 100 })
          .toFile(resizedImagePath);

        const result = await cloudinary.uploader.upload(resizedImagePath, {
          folder: "products",
          background_removal: "cloudinary_ai",
          format: "png",
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        fs.unlinkSync(resizedImagePath);
      } catch (error) {
        console.error("Error processing Base64 image", error);
        throw new Error("Error resizing or uploading Base64 image to Cloudinary.");
      }
    } else {
      // 3) Local file path
      const fileExtension = path.extname(imagePath).toLowerCase();
      if (!allowedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      try {
        const resizedImagePath = `uploads/resized-${Date.now()}-${i}.png`;
        await sharp(imagePath)
          .resize(1600, 1600)
          .png({ quality: 100 })
          .toFile(resizedImagePath);

        const result = await cloudinary.uploader.upload(resizedImagePath, {
          folder: "products",
          background_removal: "cloudinary_ai",
          format: "png",
        });

        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });

        fs.unlinkSync(resizedImagePath);
      } catch (error) {
        console.error("Error processing image", error);
        throw new Error("Error resizing or uploading image to Cloudinary.");
      }
    }
  }

  return imagesLinks;
};

module.exports = uploadImages;
