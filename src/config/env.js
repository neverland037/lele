const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'lesli-estela-secret-token-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite'),
  UPLOADS_DIR: process.env.UPLOADS_DIR || path.join(__dirname, '../../public/uploads'),
  DEFAULT_ADMIN_USER: process.env.DEFAULT_ADMIN_USER || 'admin',
  DEFAULT_ADMIN_PASS: process.env.DEFAULT_ADMIN_PASS || 'admin123'
};
