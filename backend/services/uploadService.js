const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary if configuration variables are set
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Uploads a local file (processed by Multer) to either Cloudinary or keeps it locally
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} The URL of the uploaded image
 */
const uploadImage = async (file) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const useCloudinary = process.env.USE_CLOUDINARY === 'true';

  if (useCloudinary) {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary environment variables are missing');
      }

      // Upload file to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'hangout_cafe',
        resource_type: 'image'
      });

      // Safely delete the temporary local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return result.secure_url;
    } catch (error) {
      // If Cloudinary upload fails, try to cleanup local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  } else {
    // Local storage mode: Multer has already saved the file in backend/uploads/.
    // We return the relative URL path to retrieve it via Express static middleware.
    return `/uploads/${file.filename}`;
  }
};

/**
 * Deletes an image from local disk or Cloudinary depending on its URL
 * @param {string} imageUrl - The full URL or relative path of the image
 * @returns {Promise<void>}
 */
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  const isCloudinary = imageUrl.includes('cloudinary.com');

  if (isCloudinary) {
    try {
      // Example Cloudinary URL:
      // https://res.cloudinary.com/cloud_name/image/upload/v12345678/hangout_cafe/filename.jpg
      // We need to extract: "hangout_cafe/filename" (the public ID)
      const urlParts = imageUrl.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];
      
      const publicId = `${folderName}/${fileNameWithExt.split('.')[0]}`; // 'hangout_cafe/filename'
      
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted Cloudinary image: ${publicId}`);
    } catch (error) {
      console.error(`Failed to delete Cloudinary image: ${error.message}`);
    }
  } else if (imageUrl.startsWith('/uploads/')) {
    try {
      const fileName = imageUrl.replace('/uploads/', '');
      const filePath = path.join(__dirname, '../uploads', fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local image: ${fileName}`);
      }
    } catch (error) {
      console.error(`Failed to delete local image: ${error.message}`);
    }
  }
};

module.exports = {
  uploadImage,
  deleteImage
};
