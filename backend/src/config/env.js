require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cktracker?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'cktracker_dev_jwt_secret_modular_kitchen_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'cktracker',
    api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
  },
  SMTP: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'CKTracker Modular Kitchens <notifications@cktracker.com>',
  },
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
