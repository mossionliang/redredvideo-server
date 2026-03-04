// routes/admin/drama.js
// 剧集管理 - 运营后台 API
const express = require('express');
const router = express.Router();
const db = require('../../database/init');
const { coverUpload } = require('../../middleware/upload');

// 获取剧集列表（支持筛选、分页）
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, category_id, keyword, sort = 'created_at', order = 'DESC' } = req.query;
  const offset = (page - 1) * pageSize;

  let where = '1=1';
  const params = [];

  if (status) {
    where += ' AND d.status = ?';
    params.push(status);
  }
  if (category_id) {
    where += ' AND d.category_id = ?';
    params.push(category_id);
  }
  if (keyword) {
    where += ' AND (d.title LIKE ? OR d.author LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  // 允许的排序字段
  const allowedSorts = ['created_at', 'play_count', 'like_count', 'rating', 'sort_order', 'updated_at'];
  const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countSql = `SELECT COUNT(*) as total FROM dramas d WHERE ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT d.*, c.name as category_name 
    FROM dramas d 
    LEFT JOIN categories c ON d.category_id = c.id 
    WHERE ${where} 
    ORDER BY d.${sortField} ${sortOrder} 
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

  // 解析 tags JSON
  list.forEach(item => {
    try { item.tags = JSON.parse(item.tags); } catch { item.tags = []; }
  });

  res.json({
    code: 0,
    data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) },
  });
});

// 获取剧集详情
router.get('/:id', (req, res) => {
  const drama = db.prepare(`
    SELECT d.*, c.name as category_name 
    FROM dramas d 
    LEFT JOIN categories c ON d.category_id = c.id 
    WHERE d.id = ?
  `).get(req.params.id);

  if (!drama) {
    return res.status(404).json({ code: 404, message: '剧集不存在' });
  }

  try { drama.tags = JSON.parse(drama.tags); } catch { drama.tags = []; }

  // 获取分集列表
  const episodes = db.prepare(
    'SELECT * FROM episodes WHERE drama_id = ? ORDER BY episode_number ASC'
  ).all(req.params.id);

  res.json({ code: 0, data: { ...drama, episodes } });
});

// 创建剧集
router.post('/', coverUpload.single('cover'), (req, res) => {
  const { title, description, category_id, tags, author, free_episodes, price_per_episode, vip_free } = req.body;

  if (!title) {
    return res.status(400).json({ code: 400, message: '标题不能为空' });
  }

  const cover_url = req.file ? `/uploads/covers/${req.file.filename}` : '';
  const tagsJson = tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : '[]';

  const result = db.prepare(`
    INSERT INTO dramas (title, cover_url, description, category_id, tags, author, free_episodes, price_per_episode, vip_free)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, cover_url, description || '', parseInt(category_id) || 0,
    tagsJson, author || '', parseInt(free_episodes) || 0,
    parseFloat(price_per_episode) || 0, parseInt(vip_free) || 0
  );

  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' });
});

// 更新剧集
router.put('/:id', coverUpload.single('cover'), (req, res) => {
  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id);
  if (!drama) {
    return res.status(404).json({ code: 404, message: '剧集不存在' });
  }

  const { title, description, category_id, tags, author, free_episodes, price_per_episode, vip_free, status, sort_order, is_recommended, is_top } = req.body;
  const cover_url = req.file ? `/uploads/covers/${req.file.filename}` : drama.cover_url;
  const tagsJson = tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : drama.tags;

  db.prepare(`
    UPDATE dramas SET 
      title = ?, cover_url = ?, description = ?, category_id = ?, tags = ?,
      author = ?, free_episodes = ?, price_per_episode = ?, vip_free = ?,
      status = ?, sort_order = ?, is_recommended = ?, is_top = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || drama.title, cover_url, description ?? drama.description,
    parseInt(category_id) || drama.category_id, tagsJson,
    author ?? drama.author, parseInt(free_episodes) ?? drama.free_episodes,
    parseFloat(price_per_episode) ?? drama.price_per_episode, parseInt(vip_free) ?? drama.vip_free,
    status || drama.status, parseInt(sort_order) ?? drama.sort_order,
    parseInt(is_recommended) ?? drama.is_recommended, parseInt(is_top) ?? drama.is_top,
    req.params.id
  );

  res.json({ code: 0, message: '更新成功' });
});

// 上架/下架
router.post('/:id/publish', (req, res) => {
  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id);
  if (!drama) return res.status(404).json({ code: 404, message: '剧集不存在' });

  db.prepare('UPDATE dramas SET status = ?, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('published', req.params.id);
  res.json({ code: 0, message: '上架成功' });
});

router.post('/:id/offline', (req, res) => {
  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id);
  if (!drama) return res.status(404).json({ code: 404, message: '剧集不存在' });

  db.prepare('UPDATE dramas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('offline', req.params.id);
  res.json({ code: 0, message: '下架成功' });
});

// 删除剧集
router.delete('/:id', (req, res) => {
  const drama = db.prepare('SELECT * FROM dramas WHERE id = ?').get(req.params.id);
  if (!drama) return res.status(404).json({ code: 404, message: '剧集不存在' });

  db.prepare('DELETE FROM dramas WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '删除成功' });
});

// 批量操作
router.post('/batch', (req, res) => {
  const { ids, action } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择要操作的剧集' });
  }

  const placeholders = ids.map(() => '?').join(',');
  
  switch (action) {
    case 'publish':
      db.prepare(`UPDATE dramas SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...ids);
      break;
    case 'offline':
      db.prepare(`UPDATE dramas SET status = 'offline', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...ids);
      break;
    case 'delete':
      db.prepare(`DELETE FROM dramas WHERE id IN (${placeholders})`).run(...ids);
      break;
    default:
      return res.status(400).json({ code: 400, message: '不支持的操作' });
  }

  res.json({ code: 0, message: `批量${action}成功，影响 ${ids.length} 条` });
});

module.exports = router;
