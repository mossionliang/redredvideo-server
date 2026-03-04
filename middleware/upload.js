// middleware/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// 视频上传
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.uploadDir, 'videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: config.maxVideoSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.mov', '.m4v', '.avi', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的视频格式: ${ext}`));
    }
  },
});

// 封面上传
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.uploadDir, 'covers'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: config.maxCoverSize },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的图片格式: ${ext}`));
    }
  },
});

module.exports = { videoUpload, coverUpload };
