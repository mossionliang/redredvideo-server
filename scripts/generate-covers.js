// scripts/generate-covers.js
// 为所有剧集自动生成竖版封面（3:4）和横版封面（16:9）
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const db = require('../database/init');

const coverDir = path.join(__dirname, '..', 'uploads', 'covers');
if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });

// 每个分类对应不同的配色方案
const categoryThemes = {
  1: { colors: ['#FF6B8A', '#FF4080'], emoji: '💕', label: '甜宠' },   // 甜宠
  2: { colors: ['#8B5CF6', '#6D28D9'], emoji: '💔', label: '虐恋' },   // 虐恋
  3: { colors: ['#F59E0B', '#D97706'], emoji: '⚡', label: '穿越' },   // 穿越
  4: { colors: ['#3B82F6', '#1D4ED8'], emoji: '🏙️', label: '都市' },   // 都市
  5: { colors: ['#EC4899', '#BE185D'], emoji: '🏯', label: '古装' },   // 古装
  6: { colors: ['#1F2937', '#111827'], emoji: '🔍', label: '悬疑' },   // 悬疑
  7: { colors: ['#10B981', '#059669'], emoji: '😂', label: '喜剧' },   // 喜剧
  8: { colors: ['#6366F1', '#4338CA'], emoji: '🌟', label: '其他' },   // 其他
};

const defaultTheme = { colors: ['#FF4040', '#CC3333'], emoji: '🎬', label: '短剧' };

// 随机装饰元素
const decorations = ['✦', '◆', '❖', '★', '●', '◇', '▲', '♦'];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function generateCover(drama, type) {
  // type: 'vertical' (300x400) or 'horizontal' (640x360)
  const width = type === 'vertical' ? 300 : 640;
  const height = type === 'vertical' ? 400 : 360;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const theme = categoryThemes[drama.category_id] || defaultTheme;
  const c1 = hexToRgb(theme.colors[0]);
  const c2 = hexToRgb(theme.colors[1]);
  
  // 渐变背景
  const grad = ctx.createLinearGradient(0, 0, width * 0.3, height);
  grad.addColorStop(0, theme.colors[0]);
  grad.addColorStop(1, theme.colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  // 装饰性几何图形
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 20 + Math.random() * 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  
  // 底部加深遮罩（让文字更清晰）
  ctx.globalAlpha = 1;
  const darkGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
  darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
  darkGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, width, height);
  
  // 顶部光效
  ctx.globalAlpha = 0.15;
  const lightGrad = ctx.createRadialGradient(width * 0.7, height * 0.2, 0, width * 0.7, height * 0.2, width * 0.5);
  lightGrad.addColorStop(0, '#fff');
  lightGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  
  if (type === 'vertical') {
    // === 竖版封面 ===
    
    // 大 emoji
    ctx.font = '60px serif';
    ctx.textAlign = 'center';
    ctx.fillText(theme.emoji, width / 2, height * 0.35);
    
    // 标题（自动换行）
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    const title = drama.title;
    const maxWidth = width - 40;
    
    if (title.length <= 5) {
      ctx.font = 'bold 32px "PingFang SC", "Helvetica Neue", sans-serif';
      ctx.fillText(title, width / 2, height * 0.55);
    } else if (title.length <= 8) {
      ctx.font = 'bold 26px "PingFang SC", "Helvetica Neue", sans-serif';
      ctx.fillText(title, width / 2, height * 0.55);
    } else {
      ctx.font = 'bold 22px "PingFang SC", "Helvetica Neue", sans-serif';
      // 两行
      const mid = Math.ceil(title.length / 2);
      ctx.fillText(title.substring(0, mid), width / 2, height * 0.52);
      ctx.fillText(title.substring(mid), width / 2, height * 0.60);
    }
    
    // 分类标签
    const labelText = theme.label;
    ctx.font = 'bold 12px "PingFang SC", sans-serif';
    const labelWidth = ctx.measureText(labelText).width + 16;
    const labelX = (width - labelWidth) / 2;
    const labelY = height * 0.68;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, labelX, labelY, labelWidth, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, width / 2, labelY + 15);
    
    // 底部集数 & 评分
    ctx.font = '12px "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    const info = `${drama.total_episodes}集全 · ${drama.rating.toFixed(1)}分`;
    ctx.fillText(info, width / 2, height - 25);
    
  } else {
    // === 横版封面（Banner） ===
    
    // 左侧 emoji
    ctx.font = '50px serif';
    ctx.textAlign = 'left';
    ctx.fillText(theme.emoji, 30, height * 0.45);
    
    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px "PingFang SC", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'left';
    const title = drama.title;
    if (title.length > 10) {
      ctx.font = 'bold 24px "PingFang SC", "Helvetica Neue", sans-serif';
    }
    ctx.fillText(title, 100, height * 0.42);
    
    // 简介（截断）
    ctx.font = '14px "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const desc = (drama.description || '').substring(0, 25);
    ctx.fillText(desc, 100, height * 0.55);
    
    // 右下角标签
    ctx.font = 'bold 14px "PingFang SC", sans-serif';
    const tag = `${theme.label} · ${drama.total_episodes}集`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    const tw = ctx.measureText(tag).width + 20;
    roundRect(ctx, width - tw - 20, height - 50, tw, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(tag, width - 30, height - 31);
    
    // 评分
    ctx.font = 'bold 20px "PingFang SC", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`★ ${drama.rating.toFixed(1)}`, 100, height * 0.72);
    
    // 播放量
    ctx.font = '13px "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const plays = drama.play_count >= 10000 
      ? `${(drama.play_count / 10000).toFixed(1)}万次播放` 
      : `${drama.play_count}次播放`;
    ctx.fillText(plays, 200, height * 0.72);
  }
  
  return canvas.toBuffer('image/jpeg', { quality: 0.85 });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// 开始生成
const dramas = db.prepare('SELECT * FROM dramas ORDER BY id').all();
console.log(`🎨 开始为 ${dramas.length} 部剧集生成封面...\n`);

const updateCover = db.prepare('UPDATE dramas SET cover_url = ?, banner_url = ? WHERE id = ?');

const generateAll = db.transaction(() => {
  for (const drama of dramas) {
    // 竖版封面
    const vBuffer = generateCover(drama, 'vertical');
    const vFile = `cover_v_${drama.id}.jpg`;
    fs.writeFileSync(path.join(coverDir, vFile), vBuffer);
    
    // 横版封面
    const hBuffer = generateCover(drama, 'horizontal');
    const hFile = `cover_h_${drama.id}.jpg`;
    fs.writeFileSync(path.join(coverDir, hFile), hBuffer);
    
    // 更新数据库
    updateCover.run(`/uploads/covers/${vFile}`, `/uploads/covers/${hFile}`, drama.id);
    
    console.log(`  ✓ [${drama.id}] ${drama.title} → ${vFile} + ${hFile}`);
  }
});

generateAll();

console.log(`\n✅ 完成！共生成 ${dramas.length * 2} 张封面图`);
console.log(`📂 保存路径: ${coverDir}`);
