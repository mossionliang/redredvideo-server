// routes/admin/category.js
// 分类与标签管理
const express = require('express');
const router = express.Router();
const db = require('../../database/init');

// === 分类 ===

// 获取分类列表（树形）
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  // 构建树形结构
  const tree = categories.filter(c => c.parent_id === 0).map(parent => ({
    ...parent,
    children: categories.filter(c => c.parent_id === parent.id),
  }));
  res.json({ code: 0, data: tree });
});

// 创建分类
router.post('/', (req, res) => {
  const { name, parent_id, icon, sort_order } = req.body;
  if (!name) return res.status(400).json({ code: 400, message: '分类名称不能为空' });

  const result = db.prepare('INSERT INTO categories (name, parent_id, icon, sort_order) VALUES (?, ?, ?, ?)')
    .run(name, parseInt(parent_id) || 0, icon || '', parseInt(sort_order) || 0);
  res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' });
});

// 更新分类
router.put('/:id', (req, res) => {
  const { name, parent_id, icon, sort_order } = req.body;
  db.prepare('UPDATE categories SET name = ?, parent_id = ?, icon = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, parseInt(parent_id) || 0, icon || '', parseInt(sort_order) || 0, req.params.id);
  res.json({ code: 0, message: '更新成功' });
});

// 删除分类
router.delete('/:id', (req, res) => {
  // 检查是否有关联剧集
  const count = db.prepare('SELECT COUNT(*) as count FROM dramas WHERE category_id = ?').get(req.params.id);
  if (count.count > 0) {
    return res.status(400).json({ code: 400, message: `该分类下有 ${count.count} 部剧集，请先迁移后再删除` });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '删除成功' });
});

// === 标签 ===

// 获取标签列表
router.get('/tags', (req, res) => {
  const tags = db.prepare('SELECT * FROM tags ORDER BY group_name, id').all();
  // 按分组聚合
  const groups = {};
  tags.forEach(t => {
    if (!groups[t.group_name]) groups[t.group_name] = [];
    groups[t.group_name].push(t);
  });
  res.json({ code: 0, data: { list: tags, groups } });
});

// 创建标签
router.post('/tags', (req, res) => {
  const { name, group_name } = req.body;
  if (!name) return res.status(400).json({ code: 400, message: '标签名称不能为空' });

  try {
    const result = db.prepare('INSERT INTO tags (name, group_name) VALUES (?, ?)').run(name, group_name || '通用');
    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: '创建成功' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ code: 400, message: '标签已存在' });
    }
    throw e;
  }
});

// 删除标签
router.delete('/tags/:id', (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ code: 0, message: '删除成功' });
});

module.exports = router;
