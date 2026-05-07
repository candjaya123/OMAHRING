const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { getStoreSettings } = require("./store-settings-helper");

/**
 * Configure Cloudinary dynamically based on DB settings or fallback to ENV.
 */
async function configureCloudinary() {
  const settings = await getStoreSettings();
  
  cloudinary.config({
    cloud_name: settings.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: settings.cloudinaryApiKey || process.env.CLOUDINARY_API_KEY,
    api_secret: settings.cloudinaryApiSecret || process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = new multer.memoryStorage();

async function imageUploadUtil(file) {
  // Ensure we use the latest config from DB before each upload
  await configureCloudinary();
  
  const result = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });

  return result;
}

const upload = multer({ storage });

module.exports = { upload, imageUploadUtil };
