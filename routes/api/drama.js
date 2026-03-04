// routes/api/drama.js
// App端 API — 获取剧集数据
const express = require('express');
const router = express.Router();
const db = require('../../database/init');

// 获取已上架的剧集列表（App首页用）
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, category_id, keyword } = req.query;
  const offset = (page - 1) * pageSize;

  let where = "d.status = 'published'";
  const params = [];

  if (category_id) {
    where += ' AND d.category_id = ?';
    params.push(category_id);
  }
  if (keyword) {
    where += ' AND d.title LIKE ?';
    params.push(`%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as total FROM dramas d WHERE ${where}`).get(...params).total;

  const list = db.prepare(`
    SELECT d.id, d.title, d.cover_url, d.banner_url, d.description, d.category_id, d.tags,
           d.total_episodes, d.free_episodes, d.price_per_episode, d.vip_free,
           d.author, d.play_count, d.like_count, d.rating,
           d.is_recommended, d.is_top, d.published_at,
           c.name as category_name
    FROM dramas d
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE ${where}
    ORDER BY d.is_top DESC, d.sort_order DESC, d.published_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  list.forEach(item => {
    try { item.tags = JSON.parse(item.tags); } catch { item.tags = []; }
  });

  res.json({ code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

// 获取推荐剧集
router.get('/recommended', (req, res) => {
  const list = db.prepare(`
    SELECT id, title, cover_url, banner_url, description, author, play_count, rating, tags
    FROM dramas
    WHERE status = 'published' AND is_recommended = 1
    ORDER BY sort_order DESC, published_at DESC
    LIMIT 10
  `).all();

  list.forEach(item => {
    try { item.tags = JSON.parse(item.tags); } catch { item.tags = []; }
  });

  res.json({ code: 0, data: list });
});

// 获取剧集详情（App端）
router.get('/:id', (req, res) => {
  const drama = db.prepare(`
    SELECT d.*, c.name as category_name
    FROM dramas d
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE d.id = ? AND d.status = 'published'
  `).get(req.params.id);

  if (!drama) {
    return res.status(404).json({ code: 404, message: '剧集不存在或未上架' });
  }

  try { drama.tags = JSON.parse(drama.tags); } catch { drama.tags = []; }

  // 获取已发布的分集
  const episodes = db.prepare(`
    SELECT id, episode_number, title, video_url, cover_url, duration, is_free, play_count
    FROM episodes
    WHERE drama_id = ? AND status = 'published'
    ORDER BY episode_number ASC
  `).all(req.params.id);

  // 更新播放量
  db.prepare('UPDATE dramas SET play_count = play_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ code: 0, data: { ...drama, episodes } });
});

// 获取分集视频（App播放用）
router.get('/:dramaId/episodes/:epNumber', (req, res) => {
  const episode = db.prepare(`
    SELECT e.*, d.title as drama_title
    FROM episodes e
    JOIN dramas d ON e.drama_id = d.id
    WHERE e.drama_id = ? AND e.episode_number = ? AND e.status = 'published' AND d.status = 'published'
  `).get(req.params.dramaId, req.params.epNumber);

  if (!episode) {
    return res.status(404).json({ code: 404, message: '该集不存在或未上架' });
  }

  // 更新播放量
  db.prepare('UPDATE episodes SET play_count = play_count + 1 WHERE id = ?').run(episode.id);

  res.json({ code: 0, data: episode });
});

// 获取分类列表（App端）
router.get('/meta/categories', (req, res) => {
  const categories = db.prepare('SELECT id, name, icon FROM categories WHERE parent_id = 0 ORDER BY sort_order ASC').all();
  res.json({ code: 0, data: categories });
});

// 首页视频流（给首页沉浸式播放用）
// 参数：
//   page     - 页码（默认1）
//   pageSize - 每页数量（默认10）
//   seed     - 随机种子（客户端每次启动/刷新时生成一个随机整数，翻页时保持不变）
//              不同 seed = 不同排序 → 不同用户看到不同内容
//              相同 seed = 相同排序 → 翻页不会重复
//   exclude  - 已看过的视频ID列表，逗号分隔（可选，防止刷新后重复）
router.get('/feed/videos', (req, res) => {
  const { page = 1, pageSize = 10, seed, exclude } = req.query;
  const offset = (page - 1) * pageSize;
  const seedNum = parseInt(seed) || Date.now();

  // 排除已看过的剧ID
  let excludeClause = '';
  const params = [];
  if (exclude) {
    const excludeIds = exclude.split(',').map(Number).filter(n => n > 0);
    if (excludeIds.length > 0) {
      excludeClause = `AND d.id NOT IN (${excludeIds.map(() => '?').join(',')})`;
      params.push(...excludeIds);
    }
  }

  // 只返回每个剧的第一集（episode_number = 1）
  // 用 seed 对 drama.id 做哈希，生成稳定的伪随机排序
  const videos = db.prepare(`
    SELECT e.id, e.episode_number, e.title, e.video_url, e.cover_url, e.duration, e.play_count,
           d.id as drama_id, d.title as drama_title, d.author, d.like_count, 
           d.description, d.cover_url as drama_cover, d.total_episodes
    FROM episodes e
    JOIN dramas d ON e.drama_id = d.id
    WHERE e.status = 'published' AND d.status = 'published' AND e.video_url != ''
    AND e.episode_number = 1
    ${excludeClause}
    ORDER BY ((d.id * ${seedNum}) % 104729 + (d.id * 31) % 7919) ASC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  // 总数（用于客户端判断是否还有更多）
  const total = db.prepare(`
    SELECT COUNT(*) as total FROM dramas d
    WHERE d.status = 'published'
    AND EXISTS (
      SELECT 1 FROM episodes e 
      WHERE e.drama_id = d.id 
      AND e.status = 'published' 
      AND e.video_url != '' 
      AND e.episode_number = 1
    )
    ${excludeClause}
  `).get(...params).total;

  res.json({
    code: 0,
    data: {
      list: videos,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      hasMore: offset + videos.length < total,
      seed: seedNum,
    },
  });
});

module.exports = router;
