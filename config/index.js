// config/index.js
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  dbPath: path.join(__dirname, '..', 'database', 'redred.db'),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  // 视频和封面的最大文件大小
  maxVideoSize: 500 * 1024 * 1024,  // 500MB
  maxCoverSize: 10 * 1024 * 1024,   // 10MB
};
