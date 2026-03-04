// routes/admin/episode.js
// 分集管理 - 运营后台 API
const express = require('express');
const router = express.Router();
const db = require('../../database/init');
const { videoUpload, coverUpload } = require('../../middleware/upload');

// 获取某剧集的分集列表
router.get('/drama/:dramaId', (req, res) => {
  const episodes = db.prepare(
    'SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number ASC'
  ).all(req.params.dramaId);

  res.json({ code: 0, data: episodes });
});

// 上传分集（视频文件 + 信息）
router.post('/upload', videoUpload.single('video'), (req, res) => {
  const { drama_id, episode_number, title, is_free } = req.body;

  if (!drama_id) {
    return res.status(400).json({ code: 400, message: 'drama_id 不能为空' });
  }

  // 检查剧集是否存在
  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(drama_id);
  if (!drama) {
    return res.status(404).json({ code: 404, message: '剧集不存在' });
  }

  // 自动计算集数
  let epNum = parseInt(episode_number);
  if (!epNum) {
    const max = db.prepare('SELECT MAX(episode_number) as max FROM episodes WHERE drama_id = ?').get(drama_id);
    epNum = (max.max || 0) + 1;
  }

  // 检查集数是否重复
  const existing = db.prepare('SELECT id FROM episodes WHERE drama_id = ? AND episode_number = ?').get(drama_id, epNum);
  if (existing) {
    return res.status(400).json({ code: 400, message: `第 ${epNum} 集已存在` });
  }

  const video_url = req.file ? `/uploads/videos/${req.file.filename}` : '';
  const file_size = req.file ? req.file.size : 0;

  const result = db.prepare(`
    INSERT INTO episodes (drama_id, episode_number, title, video_url, file_size, is_free, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    parseInt(drama_id), epNum,
    title || `第${epNum}集`,
    video_url, file_size,
    parseInt(is_free) || 0, epNum
  );

  // 更新剧集总集数
  const totalEp = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(drama_id);
  db.prepare('UPDATE dramas SET total_episodes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(totalEp.count, drama_id);

  res.json({
    code: 0,
    data: { id: result.lastInsertRowid, episode_number: epNum },
    message: `第${epNum}集上传成功`,
  });
});

// 批量上传分集（多个视频文件）
router.post('/batch-upload', videoUpload.array('videos', 50), (req, res) => {
  const { drama_id } = req.body;
  if (!drama_id) {
    return res.status(400).json({ code: 400, message: 'drama_id 不能为空' });
  }

  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(drama_id);
  if (!drama) {
    return res.status(404).json({ code: 404, message: '剧集不存在' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择视频文件' });
  }

  const max = db.prepare('SELECT MAX(episode_number) as max FROM episodes WHERE drama_id = ?').get(drama_id);
  let nextEp = (max.max || 0) + 1;

  const insertEp = db.prepare(`
    INSERT INTO episodes (drama_id, episode_number, title, video_url, file_size, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const results = [];
  const insertAll = db.transaction(() => {
    for (const file of req.files) {
      const epNum = nextEp++;
      const result = insertEp.run(
        parseInt(drama_id), epNum,
        `第${epNum}集`,
        `/uploads/videos/${file.filename}`,
        file.size, epNum
      );
      results.push({ id: result.lastInsertRowid, episode_number: epNum, filename: file.originalname });
    }
  });
  insertAll();

  // 更新总集数
  const totalEp = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(drama_id);
  db.prepare('UPDATE dramas SET total_episodes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(totalEp.count, drama_id);

  res.json({
    code: 0,
    data: results,
    message: `成功上传 ${results.length} 集`,
  });
});

// 更新分集信息
router.put('/:id', (req, res) => {
  const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
  if (!episode) {
    return res.status(404).json({ code: 404, message: '分集不存在' });
  }

  const { title, episode_number, is_free, status, sort_order } = req.body;

  db.prepare(`
    UPDATE episodes SET
      title = ?, episode_number = ?, is_free = ?, status = ?, sort_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title ?? episode.title,
    parseInt(episode_number) || episode.episode_number,
    parseInt(is_free) ?? episode.is_free,
    status || episode.status,
    parseInt(sort_order) ?? episode.sort_order,
    req.params.id
  );

  res.json({ code: 0, message: '更新成功' });
});

// 替换视频文件
router.post('/:id/replace-video', videoUpload.single('video'), (req, res) => {
  const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
  if (!episode) {
    return res.status(404).json({ code: 404, message: '分集不存在' });
  }

  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择视频文件' });
  }

  db.prepare('UPDATE episodes SET video_url = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(`/uploads/videos/${req.file.filename}`, req.file.size, req.params.id);

  res.json({ code: 0, message: '视频替换成功' });
});

// 删除分集
router.delete('/:id', (req, res) => {
  const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
  if (!episode) {
    return res.status(404).json({ code: 404, message: '分集不存在' });
  }

  db.prepare('DELETE FROM episodes WHERE id = ?').run(req.params.id);

  // 更新总集数
  const totalEp = db.prepare('SELECT COUNT(*) as count FROM episodes WHERE drama_id = ?').get(episode.drama_id);
  db.prepare('UPDATE dramas SET total_episodes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(totalEp.count, episode.drama_id);

  res.json({ code: 0, message: '删除成功' });
});

// 分集排序
router.post('/reorder', (req, res) => {
  const { drama_id, order } = req.body; // order: [{ id: 1, sort_order: 1 }, ...]
  if (!drama_id || !order) {
    return res.status(400).json({ code: 400, message: '参数不完整' });
  }

  const updateOrder = db.prepare('UPDATE episodes SET sort_order = ?, episode_number = ? WHERE id = ? AND drama_id = ?');
  const reorder = db.transaction(() => {
    for (const item of order) {
      updateOrder.run(item.sort_order, item.sort_order, item.id, drama_id);
    }
  });
  reorder();

  res.json({ code: 0, message: '排序更新成功' });
});

module.exports = router;
