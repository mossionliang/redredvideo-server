// app.js
// 红红短剧 - 后台服务
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// 初始化数据库（自动建表）
require('./database/init');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（上传的视频和图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 后台管理页面
app.use('/public', express.static(path.join(__dirname, 'public')));
// /admin 跳转到管理页面
app.get('/admin', (req, res) => {
  res.redirect('/public/admin.html');
});

// ===== 路由 =====

// 运营后台 API（/admin/）
app.use('/admin/dramas', require('./routes/admin/drama'));
app.use('/admin/episodes', require('./routes/admin/episode'));
app.use('/admin/categories', require('./routes/admin/category'));

// App 端 API（/api/）
app.use('/api/dramas', require('./routes/api/drama'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 文档首页
app.get('/', (req, res) => {
  res.json({
    name: '红红短剧 - 内容管理服务',
    version: '1.0.0',
    endpoints: {
      '运营后台': {
        '剧集列表':     'GET    /admin/dramas',
        '剧集详情':     'GET    /admin/dramas/:id',
        '创建剧集':     'POST   /admin/dramas',
        '更新剧集':     'PUT    /admin/dramas/:id',
        '上架':         'POST   /admin/dramas/:id/publish',
        '下架':         'POST   /admin/dramas/:id/offline',
        '删除剧集':     'DELETE /admin/dramas/:id',
        '批量操作':     'POST   /admin/dramas/batch',
        '分集列表':     'GET    /admin/episodes/drama/:dramaId',
        '上传分集':     'POST   /admin/episodes/upload',
        '批量上传':     'POST   /admin/episodes/batch-upload',
        '更新分集':     'PUT    /admin/episodes/:id',
        '替换视频':     'POST   /admin/episodes/:id/replace-video',
        '删除分集':     'DELETE /admin/episodes/:id',
        '分集排序':     'POST   /admin/episodes/reorder',
        '分类列表':     'GET    /admin/categories',
        '创建分类':     'POST   /admin/categories',
        '更新分类':     'PUT    /admin/categories/:id',
        '删除分类':     'DELETE /admin/categories/:id',
        '标签列表':     'GET    /admin/categories/tags',
        '创建标签':     'POST   /admin/categories/tags',
        '删除标签':     'DELETE /admin/categories/tags/:id',
      },
      'App端': {
        '剧集列表':     'GET    /api/dramas',
        '推荐剧集':     'GET    /api/dramas/recommended',
        '剧集详情':     'GET    /api/dramas/:id',
        '分集播放':     'GET    /api/dramas/:dramaId/episodes/:epNumber',
        '分类列表':     'GET    /api/dramas/meta/categories',
        '首页视频流':   'GET    /api/dramas/feed/videos',
      },
    },
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ code: 400, message: '文件大小超出限制' });
    }
    return res.status(400).json({ code: 400, message: err.message });
  }
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
});

// 启动（监听所有网络接口，手机可通过局域网IP访问）
app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n🎬 红红短剧 内容管理服务已启动`);
  console.log(`📍 地址: http://localhost:${config.port}`);
  console.log(`📂 上传目录: ${config.uploadDir}`);
  console.log(`💾 数据库: ${config.dbPath}\n`);
});
