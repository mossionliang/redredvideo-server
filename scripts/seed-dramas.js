// scripts/seed-dramas.js
// 批量创建50部剧集 + 每部3-8集分集
const db = require('../database/init');

const videoUrls = [
  '/uploads/videos/sample1.mp4',
  '/uploads/videos/sample2.mp4',
  '/uploads/videos/sample3.mp4',
];

// 先下载几个示例视频到 uploads
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const sampleVideos = [
  { url: 'https://www.w3school.com.cn/i/movie.mp4', file: 'sample1.mp4' },
  { url: 'https://vjs.zencdn.net/v/oceans.mp4', file: 'sample2.mp4' },
  { url: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4', file: 'sample3.mp4' },
];

const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');

function download(urlStr, dest) {
  return new Promise((resolve, reject) => {
    // 如果已存在就跳过
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`  ✓ ${path.basename(dest)} 已存在，跳过`);
      return resolve();
    }
    console.log(`  ↓ 下载 ${urlStr}...`);
    const mod = urlStr.startsWith('https') ? https : http;
    mod.get(urlStr, { timeout: 30000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve(); });
    }).on('error', e => {
      // 下载失败就创建一个占位文件
      console.log(`  ⚠ 下载失败: ${e.message}，创建占位文件`);
      fs.writeFileSync(dest, 'placeholder');
      resolve();
    });
  });
}

const dramas = [
  // 甜宠 (category_id: 1)
  { title: '霸道总裁的小甜妻', cat: 1, author: '甜心工作室', tags: '["甜蜜","霸总"]', desc: '灰姑娘意外闯入总裁的世界，一场甜蜜的追爱之旅' },
  { title: '契约甜妻超给力', cat: 1, author: '星光传媒', tags: '["甜蜜","霸总"]', desc: '假结婚变真爱，甜到齁' },
  { title: '总裁的替嫁新娘', cat: 1, author: '甜心工作室', tags: '["甜蜜","霸总"]', desc: '替姐出嫁，却被霸道总裁宠上天' },
  { title: '闪婚后大佬每天都在撩我', cat: 1, author: '蜜糖影视', tags: '["甜蜜"]', desc: '以为嫁了个普通人，没想到老公是隐藏大佬' },
  { title: '甜蜜暴击', cat: 1, author: '星光传媒', tags: '["甜蜜","校园"]', desc: '校园偶遇到恋爱暴击，青春甜宠进行时' },
  { title: '你是我的小确幸', cat: 1, author: '蜜糖影视', tags: '["甜蜜"]', desc: '细水长流的温柔爱情故事' },
  { title: '豪门甜宠日常', cat: 1, author: '甜心工作室', tags: '["甜蜜","霸总"]', desc: '嫁入豪门后被全家宠爱的日常' },

  // 虐恋 (category_id: 2)
  { title: '错嫁成殇', cat: 2, author: '虐心剧场', tags: '["虐心"]', desc: '一场错嫁，两个人的十年纠葛' },
  { title: '深情不及久伴', cat: 2, author: '虐心剧场', tags: '["虐心"]', desc: '他以为放手是成全，她却等了他一辈子' },
  { title: '余生请你指教', cat: 2, author: '星光传媒', tags: '["虐心"]', desc: '当深爱遇到误会，虐心之后是否还有明天' },
  { title: '倾城之恋不如你', cat: 2, author: '虐心剧场', tags: '["虐心"]', desc: '豪门恩怨中的爱恨情仇' },
  { title: '半是蜜糖半是伤', cat: 2, author: '蜜糖影视', tags: '["虐心","甜蜜"]', desc: '甜虐交织，爱到深处是心痛' },
  { title: '薄情总裁的弃妻', cat: 2, author: '虐心剧场', tags: '["虐心","霸总"]', desc: '被抛弃后她华丽归来' },

  // 穿越 (category_id: 3)
  { title: '穿越之王妃有毒', cat: 3, author: '古韵坊', tags: '["重生"]', desc: '现代女白领穿越成废柴王妃，开启逆袭之路' },
  { title: '重生后我成了团宠', cat: 3, author: '古韵坊', tags: '["重生"]', desc: '重生回到五岁，这次一定要好好活' },
  { title: '穿书后反派大佬爱上我', cat: 3, author: '星光传媒', tags: '["重生"]', desc: '穿进小说世界，攻略反派BOSS' },
  { title: '回到古代当太后', cat: 3, author: '古韵坊', tags: '["重生"]', desc: '现代历史系博士穿越，凭知识逆风翻盘' },
  { title: '重生千金不好惹', cat: 3, author: '甜心工作室', tags: '["重生","复仇"]', desc: '重生回到被害前，这次她要让所有人付出代价' },
  { title: '穿越之锦绣农门', cat: 3, author: '古韵坊', tags: '["重生"]', desc: '穿越到古代农家，带领全村致富' },

  // 都市 (category_id: 4)
  { title: '都市之绝世神医', cat: 4, author: '热血工坊', tags: '["热血"]', desc: '隐世神医回归都市，一手医术惊天下' },
  { title: '最强狂兵', cat: 4, author: '热血工坊', tags: '["热血"]', desc: '退役兵王回归都市保护家人' },
  { title: '我在都市当天师', cat: 4, author: '热血工坊', tags: '["热血"]', desc: '道门传人行走都市，降妖除魔日常' },
  { title: '逆袭人生从离婚开始', cat: 4, author: '星光传媒', tags: '["复仇"]', desc: '被净身出户后意外获得系统，开启逆袭之路' },
  { title: '都市至尊战神', cat: 4, author: '热血工坊', tags: '["热血"]', desc: '五年归来，他已是至尊战神' },
  { title: '超级女婿', cat: 4, author: '星光传媒', tags: '["搞笑","热血"]', desc: '入赘女婿竟是隐藏大佬' },
  { title: '都市隐龙', cat: 4, author: '热血工坊', tags: '["热血"]', desc: '龙有逆鳞触之即怒，别惹隐藏在都市的龙' },

  // 古装 (category_id: 5)
  { title: '凤临天下', cat: 5, author: '古韵坊', tags: '["热血"]', desc: '废柴公主觉醒，一步步登上权力巅峰' },
  { title: '庶女当道', cat: 5, author: '古韵坊', tags: '["复仇"]', desc: '庶女不甘命运，斗嫡姐夺天下' },
  { title: '将军家的小娘子', cat: 5, author: '甜心工作室', tags: '["甜蜜"]', desc: '将军府的甜蜜日常' },
  { title: '锦绣长安', cat: 5, author: '古韵坊', tags: '["热血"]', desc: '大唐盛世下的权谋与爱情' },
  { title: '九州风云录', cat: 5, author: '热血工坊', tags: '["热血"]', desc: '乱世之中的英雄传奇' },
  { title: '妃常嚣张', cat: 5, author: '古韵坊', tags: '["搞笑","甜蜜"]', desc: '最嚣张的王妃，最宠妻的王爷' },

  // 悬疑 (category_id: 6)
  { title: '迷雾追踪', cat: 6, author: '谜案社', tags: '["热血"]', desc: '连环案件背后的惊天秘密' },
  { title: '暗夜追凶', cat: 6, author: '谜案社', tags: '["热血"]', desc: '刑警深入黑暗，揭开多年悬案真相' },
  { title: '消失的第七天', cat: 6, author: '谜案社', tags: '["虐心"]', desc: '她消失了七天，回来后一切都变了' },
  { title: '镜中人', cat: 6, author: '星光传媒', tags: '["热血"]', desc: '镜子里的你，是不是真正的你？' },
  { title: '密室逃生', cat: 6, author: '谜案社', tags: '["热血"]', desc: '被困密室，只有解开谜题才能活下去' },
  { title: '第十三个证人', cat: 6, author: '谜案社', tags: '["热血"]', desc: '法庭上突然出现的第十三个证人，改变了一切' },

  // 喜剧 (category_id: 7)
  { title: '我的奇葩室友', cat: 7, author: '笑工坊', tags: '["搞笑"]', desc: '四个性格迥异的室友，笑料不断' },
  { title: '老板是个恋爱脑', cat: 7, author: '笑工坊', tags: '["搞笑","甜蜜"]', desc: '霸道总裁竟然是个恋爱废柴' },
  { title: '全能打工人', cat: 7, author: '笑工坊', tags: '["搞笑"]', desc: '社畜翻身记，笑着笑着就哭了' },
  { title: '相亲对象是前任', cat: 7, author: '蜜糖影视', tags: '["搞笑","甜蜜"]', desc: '相亲居然遇到前任，尴尬又心动' },
  { title: '我家猫是大明星', cat: 7, author: '笑工坊', tags: '["搞笑"]', desc: '一只猫意外走红网络后的爆笑日常' },
  { title: '职场菜鸟进化论', cat: 7, author: '星光传媒', tags: '["搞笑"]', desc: '实习生的职场生存指南' },

  // 其他 (category_id: 8)
  { title: '末日求生指南', cat: 8, author: '热血工坊', tags: '["热血"]', desc: '丧尸横行的世界，如何活下去' },
  { title: '星际远征', cat: 8, author: '热血工坊', tags: '["热血"]', desc: '人类踏上星际旅程，寻找新家园' },
  { title: '灵异公寓', cat: 8, author: '谜案社', tags: '["虐心"]', desc: '搬进新公寓后，奇怪的事接连发生' },
  { title: '时间商人', cat: 8, author: '星光传媒', tags: '["热血"]', desc: '能交易时间的人，你愿意卖掉多少年？' },
];

async function seed() {
  console.log('📥 下载示例视频...');
  for (const v of sampleVideos) {
    await download(v.url, path.join(uploadDir, v.file));
  }

  console.log(`\n🎬 开始创建 ${dramas.length} 部剧集...\n`);

  const insertDrama = db.prepare(`
    INSERT INTO dramas (title, cover_url, description, category_id, tags, author, free_episodes, price_per_episode, status, total_episodes, published_at, play_count, like_count, rating, is_recommended)
    VALUES (?, '', ?, ?, ?, ?, ?, ?, 'published', ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
  `);

  const insertEpisode = db.prepare(`
    INSERT INTO episodes (drama_id, episode_number, title, video_url, file_size, is_free, status, sort_order, play_count)
    VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?)
  `);

  let created = 0;
  const seedAll = db.transaction(() => {
    for (const d of dramas) {
      const epCount = 3 + Math.floor(Math.random() * 6); // 3-8集
      const freeEp = Math.min(2 + Math.floor(Math.random() * 2), epCount);
      const price = [0, 0.5, 1, 1.5, 2][Math.floor(Math.random() * 5)];
      const plays = Math.floor(Math.random() * 50000);
      const likes = Math.floor(plays * (0.02 + Math.random() * 0.08));
      const rating = +(7 + Math.random() * 2.5).toFixed(1);
      const isRec = Math.random() > 0.7 ? 1 : 0;

      const result = insertDrama.run(
        d.title, d.desc, d.cat, d.tags, d.author,
        freeEp, price, epCount, plays, likes, rating, isRec
      );
      const dramaId = result.lastInsertRowid;

      for (let i = 1; i <= epCount; i++) {
        const videoUrl = videoUrls[(i - 1) % videoUrls.length];
        const isFree = i <= freeEp ? 1 : 0;
        const epPlays = Math.floor(plays * (0.3 + Math.random() * 0.7) / epCount);
        insertEpisode.run(dramaId, i, `第${i}集`, videoUrl, 1024 * 1024 * (5 + Math.floor(Math.random() * 20)), isFree, i, epPlays);
      }

      created++;
      console.log(`  ✓ [${created}/${dramas.length}] ${d.title} (${epCount}集)`);
    }
  });

  seedAll();

  const total = db.prepare('SELECT COUNT(*) as c FROM dramas').get().c;
  const totalEp = db.prepare('SELECT COUNT(*) as c FROM episodes').get().c;
  console.log(`\n✅ 完成！共 ${total} 部剧集，${totalEp} 个分集`);
}

seed().catch(console.error);
