// database/init.js
const Database = require('better-sqlite3');
const config = require('../config');
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);

// 开启 WAL 模式（更好的并发性能）
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 建表
db.exec(`
  -- 分类表
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 剧集表
  CREATE TABLE IF NOT EXISTS dramas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    category_id INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending','published','rejected','offline')),
    total_episodes INTEGER DEFAULT 0,
    free_episodes INTEGER DEFAULT 0,
    price_per_episode REAL DEFAULT 0,
    vip_free INTEGER DEFAULT 0,
    author TEXT DEFAULT '',
    uploader TEXT DEFAULT '',
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_recommended INTEGER DEFAULT 0,
    is_top INTEGER DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  -- 剧集分集表
  CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drama_id INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    title TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    cover_url TEXT DEFAULT '',
    duration INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    is_free INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','offline')),
    play_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (drama_id) REFERENCES dramas(id) ON DELETE CASCADE
  );

  -- 标签表
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    group_name TEXT DEFAULT '通用',
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 插入默认分类（如果为空）
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, parent_id, sort_order) VALUES (?, ?, ?)');
  const cats = [
    ['甜宠', 0, 1], ['虐恋', 0, 2], ['穿越', 0, 3], ['都市', 0, 4],
    ['古装', 0, 5], ['悬疑', 0, 6], ['喜剧', 0, 7], ['其他', 0, 8],
  ];
  const insertMany = db.transaction(() => {
    for (const [name, pid, order] of cats) {
      insertCat.run(name, pid, order);
    }
  });
  insertMany();
}

// 插入默认标签
const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get();
if (tagCount.count === 0) {
  const insertTag = db.prepare('INSERT INTO tags (name, group_name) VALUES (?, ?)');
  const tags = [
    ['甜蜜', '风格'], ['虐心', '风格'], ['搞笑', '风格'], ['热血', '风格'],
    ['霸总', '题材'], ['重生', '题材'], ['复仇', '题材'], ['校园', '题材'],
    ['女性向', '受众'], ['男性向', '受众'], ['全年龄', '受众'],
  ];
  const insertMany = db.transaction(() => {
    for (const [name, group] of tags) {
      insertTag.run(name, group);
    }
  });
  insertMany();
}

module.exports = db;
