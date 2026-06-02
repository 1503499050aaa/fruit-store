/**
 * 一鸣鲜果 - 后端服务入口
 * 启动命令：node index.js
 * 开发模式（自动重启）：node --watch index.js
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db, initDB } = require('./db');

// 引入路由
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3456; // 端口号，可以通过环境变量修改

// ========== 中间件配置 ==========

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== 静态文件服务 ==========
// 检查 dist 目录是否存在（如果存在就提供静态文件服务）
const adminDist = path.join(__dirname, '..', 'admin', 'dist');
const webDist = path.join(__dirname, '..', 'web', 'dist');

if (fs.existsSync(adminDist)) {
  app.use('/admin', express.static(adminDist));
}
if (fs.existsSync(webDist)) {
  app.use('/web', express.static(webDist));
}

// 访问根路径时重定向到手机端商城
app.get('/', (req, res) => {
  res.redirect('/web');
});

// ========== 注册路由 ==========

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ========== 自动初始化 ==========

// 初始化数据库表
initDB();

// 如果数据库是空的（没有管理员），自动填充种子数据
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
if (adminCount === 0) {
  console.log('🌱 检测到空数据库，自动填充种子数据...');
  autoSeed();
}

/**
 * 自动种子数据 - 等同于 seed.js 的逻辑，但内嵌在启动流程中
 * 这样部署到 Render 时不需要单独运行 seed 命令
 */
function autoSeed() {
  const hash = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');

  // 管理员
  db.prepare('INSERT INTO admins (username, password_hash, display_name, role) VALUES (?,?,?,?)').run('admin', hash('123456'), '雷一鸣', 'admin');
  db.prepare('INSERT INTO admins (username, password_hash, display_name, role) VALUES (?,?,?,?)').run('partner', hash('123456'), '合伙人小王', 'operator');

  // 分类
  const categories = [
    [1, '热带水果', 1], [2, '柑橘类', 2], [3, '浆果类', 3], [4, '瓜类', 4],
  ];
  const insertCat = db.prepare('INSERT INTO categories (id, name, sort_order) VALUES (?,?,?)');
  categories.forEach(c => insertCat.run(...c));

  // 水果商品
  const fruits = [
    [1, '海南贵妃芒果', 1, 12.8, '斤', 50, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', '海南三亚', '果肉金黄细腻，纤维少，甜度高', '⭐⭐⭐⭐⭐', '肉厚核薄,汁多味甜', 'on'],
    [2, '金枕榴莲', 1, 39.9, '斤', 20, 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', '海南乐东', '金枕品种，出肉率高，香气浓郁', '⭐⭐⭐⭐', '软糯香甜,口感绵密', 'on'],
    [3, '海南菠萝蜜', 1, 8.8, '斤', 30, 'https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=400', '海南琼海', '果肉饱满，甜脆可口', '⭐⭐⭐⭐', '甜脆多汁,果香浓郁', 'on'],
    [4, '海南红心火龙果', 1, 9.9, '斤', 40, 'https://images.unsplash.com/photo-1529361137481-1cbd4b4a9b42?w=400', '海南东方', '红心品种，甜度比白心高30%', '⭐⭐⭐⭐', '清甜爽口,汁水丰富', 'on'],
    [5, '海南莲雾', 1, 18.8, '斤', 15, 'https://images.unsplash.com/photo-1598987421437-f9ebc9d8cdb9?w=400', '海南海口', '清脆多汁，夏日解暑佳品', '⭐⭐⭐', '清脆爽口,水分足', 'on'],
    [6, '海南山竹', 1, 25.8, '斤', 10, 'https://images.unsplash.com/photo-1590875143504-89a4c9e4a3cf?w=400', '海南万宁', '果中皇后，酸甜适口', '⭐⭐⭐⭐', '酸甜适中,果肉嫩滑', 'on'],
    [7, '海南青柠檬', 2, 5.8, '斤', 60, 'https://images.unsplash.com/photo-1597871849852-21b4682aa6cc?w=400', '海南文昌', '无籽青柠，酸爽清香，泡水神器', '⭐⭐', '酸爽清新,皮薄多汁', 'on'],
    [8, '海南绿橙', 2, 7.8, '斤', 45, 'https://images.unsplash.com/photo-1587132135155-2734650e9b37?w=400', '海南琼中', '皮绿肉橙，甜中带酸，维C丰富', '⭐⭐⭐', '酸甜可口,汁水饱满', 'on'],
    [9, '海南沃柑', 2, 8.8, '斤', 35, 'https://images.unsplash.com/photo-1541688401-0b0d1e27ff4e?w=400', '海南澄迈', '皮薄易剥，纯甜无酸', '⭐⭐⭐⭐⭐', '纯甜无酸,化渣性好', 'on'],
    [10, '福橙', 2, 9.9, '斤', 25, 'https://images.unsplash.com/photo-1611080626919-7cf5a9a6d657?w=400', '海南临高', '富硒土壤种植，营养价值高', '⭐⭐⭐⭐', '香甜多汁,富硒健康', 'on'],
    [11, '海南红毛丹', 3, 15.8, '斤', 20, 'https://images.unsplash.com/photo-1621275673499-6b7f6c23f2e8?w=400', '海南保亭', '毛荔枝，果肉晶莹剔透', '⭐⭐⭐⭐', '晶莹剔透,甜嫩多汁', 'on'],
    [12, '海南百香果', 3, 6.8, '斤', 50, 'https://images.unsplash.com/photo-1557683237-098dc628c78e?w=400', '海南儋州', '黄金百香果，酸甜浓郁', '⭐⭐⭐', '香气浓郁,酸甜可口', 'on'],
    [13, '海南草莓', 3, 25.8, '斤', 10, 'https://images.unsplash.com/photo-1518636693090-8407760ab261?w=400', '海南海口', '冬季草莓，个头饱满', '⭐⭐⭐⭐', '香甜多汁,果肉紧实', 'on'],
    [14, '海南蓝莓', 3, 35.8, '斤', 8, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400', '海南三亚', '花青素爆表，护眼神器', '⭐⭐⭐⭐', '酸甜适中,营养丰富', 'on'],
    [15, '海南麒麟瓜', 4, 3.8, '斤', 80, 'https://images.unsplash.com/photo-1589984662642-e7c8e9b5b96c?w=400', '海南文昌', '皮薄瓤红，甜脆爽口', '⭐⭐⭐⭐', '皮薄汁多,甜脆爽口', 'on'],
    [16, '海南哈密瓜', 4, 5.8, '斤', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6a5f1d22?w=400', '海南乐东', '网纹哈密瓜，甜度高达18度', '⭐⭐⭐⭐⭐', '甜蜜如糖,果肉细腻', 'on'],
    [17, '海南网纹瓜', 4, 6.8, '斤', 30, 'https://images.unsplash.com/photo-1570042225831-db1b6a055278?w=400', '海南三亚', '日本品种，甜蜜软糯', '⭐⭐⭐⭐⭐', '软糯香甜,入口即化', 'on'],
    [18, '海南椰子', 1, 8.0, '个', 100, 'https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=400', '海南文昌', '新鲜青椰，椰水清甜，椰肉嫩滑', '⭐⭐⭐', '清甜解渴,天然饮品', 'on'],
    [19, '海南芭蕉', 1, 4.8, '斤', 35, 'https://images.unsplash.com/photo-1571771894821-ce9b6a5f1d22?w=400', '海南五指山', '小米蕉，个头小甜度高', '⭐⭐⭐⭐', '小巧香甜,软糯可口', 'on'],
    [20, '海南杨桃', 1, 6.8, '斤', 20, 'https://images.unsplash.com/photo-1598681449190-3a776c1b413e?w=400', '海南琼海', '五角星水果，清甜多汁', '⭐⭐⭐', '清脆爽口,造型别致', 'on'],
  ];
  const insertFruit = db.prepare('INSERT INTO products (id, name, category_id, price, unit, stock, image_url, origin, description, sweetness, taste_tags, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  fruits.forEach(f => insertFruit.run(...f));

  // 示例用户
  db.prepare('INSERT INTO users (nickname, phone) VALUES (?,?)').run('张三爱吃水果', '13847410001');
  db.prepare('INSERT INTO users (nickname, phone) VALUES (?,?)').run('集宁李大姐', '13847410002');
  db.prepare('INSERT INTO users (nickname, phone) VALUES (?,?)').run('果粉小王', '13847410003');

  console.log('✅ 种子数据填充完成（20种水果 + 2个管理员 + 3个用户）');
}

// ========== 启动服务 ==========

app.listen(PORT, () => {
  console.log('');
  console.log('🍉 ====================================');
  console.log('🍍 一鸣鲜果 后端服务已启动');
  console.log(`🍊 服务端口: ${PORT}`);
  console.log(`📊 商家后台: http://localhost:${PORT}/admin`);
  console.log(`📱 用户商城: http://localhost:${PORT}/web`);
  console.log('🍉 ====================================');
  console.log('');
});
