const cloudinary = require('cloudinary').v2;
const { CLOUDINARY } = require('./env');
const logger = require('../utils/logger');

const isConfigured = 
  CLOUDINARY.cloud_name && 
  CLOUDINARY.cloud_name !== 'cktracker' && 
  CLOUDINARY.cloud_name !== 'demo' &&
  CLOUDINARY.api_key && 
  CLOUDINARY.api_key !== 'mock_key';

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY.cloud_name,
    api_key: CLOUDINARY.api_key,
    api_secret: CLOUDINARY.api_secret,
    secure: true,
  });
  logger.info('Cloudinary SDK configured successfully.');
} else {
  logger.info('Cloudinary running in local/fallback storage mode. Set CLOUDINARY_* environment variables for live cloud uploads.');
}

/**
 * Upload a file buffer or local path to Cloudinary with fallback
 * @param {string|Buffer} fileInput
 * @param {string} folder
 * @param {string} publicId
 * @returns {Promise<{ url: string, public_id: string }>}
 */
const uploadToCloudinary = async (fileInput, folder = 'cktracker/projects', publicId = null) => {
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      const options = {
        folder,
        resource_type: 'auto',
      };
      if (publicId) options.public_id = publicId;

      cloudinary.uploader.upload(fileInput, options, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      });
    });
  }

  // Graceful local/mock fallback URL
  const mockUrl = `/uploads/${folder.replace(/\//g, '_')}_${Date.now()}_${publicId || 'asset'}.png`;
  return {
    url: mockUrl,
    public_id: `mock_${Date.now()}`,
    format: 'png',
    bytes: 10240,
  };
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadToCloudinary,
};
