/**
 * 种子数据脚本 - 填充示例水果数据和默认管理员账号
 * 运行命令：node seed.js
 */
const { db, initDB } = require('./db');
const crypto = require('crypto');

// 初始化表结构
initDB();

// 简单的密码哈希（生产环境建议用 bcrypt）
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

console.log('🌱 开始填充种子数据...');

// ========== 1. 创建管理员账号 ==========
const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO admins (username, password_hash, display_name, role)
  VALUES (?, ?, ?, ?)
`);

// 老板账号
insertAdmin.run('admin', hashPassword('123456'), '雷一鸣', 'admin');
// 合伙人账号
insertAdmin.run('partner', hashPassword('123456'), '合伙人小王', 'operator');

console.log('✅ 管理员账号已创建（admin/123456, partner/123456）');

// ========== 2. 创建商品分类 ==========
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (?, ?, ?)
`);

const categories = [
  [1, '热带水果', 1],
  [2, '柑橘类', 2],
  [3, '浆果类', 3],
  [4, '瓜类', 4],
];

for (const c of categories) {
  insertCategory.run(...c);
}
console.log('✅ 商品分类已创建');

// ========== 3. 创建示例水果商品 ==========
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, name, category_id, price, unit, stock, image_url, origin, description, sweetness, taste_tags, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const products = [
  // 热带水果
  [1, '海南贵妃芒果', 1, 12.8, '斤', 50, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', '海南三亚', '果肉金黄细腻，纤维少，甜度高', '⭐⭐⭐⭐⭐', '肉厚核薄,汁多味甜', 'on'],
  [2, '金枕榴莲', 1, 39.9, '斤', 20, 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400', '海南乐东', '金枕品种，出肉率高，香气浓郁', '⭐⭐⭐⭐', '软糯香甜,口感绵密', 'on'],
  [3, '海南菠萝蜜', 1, 8.8, '斤', 30, 'https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=400', '海南琼海', '果肉饱满，甜脆可口', '⭐⭐⭐⭐', '甜脆多汁,果香浓郁', 'on'],
  [4, '海南红心火龙果', 1, 9.9, '斤', 40, 'https://images.unsplash.com/photo-1529361137481-1cbd4b4a9b42?w=400', '海南东方', '红心品种，甜度比白心高30%', '⭐⭐⭐⭐', '清甜爽口,汁水丰富', 'on'],
  [5, '海南莲雾', 1, 18.8, '斤', 15, 'https://images.unsplash.com/photo-1598987421437-f9ebc9d8cdb9?w=400', '海南海口', '清脆多汁，夏日解暑佳品', '⭐⭐⭐', '清脆爽口,水分足', 'on'],
  [6, '海南山竹', 1, 25.8, '斤', 10, 'https://images.unsplash.com/photo-1590875143504-89a4c9e4a3cf?w=400', '海南万宁', '果中皇后，酸甜适口', '⭐⭐⭐⭐', '酸甜适中,果肉嫩滑', 'on'],
  // 柑橘类
  [7, '海南青柠檬', 2, 5.8, '斤', 60, 'https://images.unsplash.com/photo-1597871849852-21b4682aa6cc?w=400', '海南文昌', '无籽青柠，酸爽清香，泡水神器', '⭐⭐', '酸爽清新,皮薄多汁', 'on'],
  [8, '海南绿橙', 2, 7.8, '斤', 45, 'https://images.unsplash.com/photo-1587132135155-2734650e9b37?w=400', '海南琼中', '皮绿肉橙，甜中带酸，维C丰富', '⭐⭐⭐', '酸甜可口,汁水饱满', 'on'],
  [9, '海南沃柑', 2, 8.8, '斤', 35, 'https://images.unsplash.com/photo-1541688401-0b0d1e27ff4e?w=400', '海南澄迈', '皮薄易剥，纯甜无酸', '⭐⭐⭐⭐⭐', '纯甜无酸,化渣性好', 'on'],
  [10, '福橙', 2, 9.9, '斤', 25, 'https://images.unsplash.com/photo-1611080626919-7cf5a9a6d657?w=400', '海南临高', '富硒土壤种植，营养价值高', '⭐⭐⭐⭐', '香甜多汁,富硒健康', 'on'],
  // 浆果类
  [11, '海南红毛丹', 3, 15.8, '斤', 20, 'https://images.unsplash.com/photo-1621275673499-6b7f6c23f2e8?w=400', '海南保亭', '毛荔枝，果肉晶莹剔透', '⭐⭐⭐⭐', '晶莹剔透,甜嫩多汁', 'on'],
  [12, '海南百香果', 3, 6.8, '斤', 50, 'https://images.unsplash.com/photo-1557683237-098dc628c78e?w=400', '海南儋州', '黄金百香果，酸甜浓郁', '⭐⭐⭐', '香气浓郁,酸甜可口', 'on'],
  [13, '海南草莓', 3, 25.8, '斤', 10, 'https://images.unsplash.com/photo-1518636693090-8407760ab261?w=400', '海南海口', '冬季草莓，个头饱满', '⭐⭐⭐⭐', '香甜多汁,果肉紧实', 'on'],
  [14, '海南蓝莓', 3, 35.8, '斤', 8, 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400', '海南三亚', '花青素爆表，护眼神器', '⭐⭐⭐⭐', '酸甜适中,营养丰富', 'on'],
  // 瓜类
  [15, '海南麒麟瓜', 4, 3.8, '斤', 80, 'https://images.unsplash.com/photo-1589984662642-e7c8e9b5b96c?w=400', '海南文昌', '皮薄瓤红，甜脆爽口', '⭐⭐⭐⭐', '皮薄汁多,甜脆爽口', 'on'],
  [16, '海南哈密瓜', 4, 5.8, '斤', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6a5f1d22?w=400', '海南乐东', '网纹哈密瓜，甜度高达18度', '⭐⭐⭐⭐⭐', '甜蜜如糖,果肉细腻', 'on'],
  [17, '海南网纹瓜', 4, 6.8, '斤', 30, 'https://images.unsplash.com/photo-1570042225831-db1b6a055278?w=400', '海南三亚', '日本品种，甜蜜软糯', '⭐⭐⭐⭐⭐', '软糯香甜,入口即化', 'on'],
  // 其他特色海南水果
  [18, '海南椰子', 1, 8.0, '个', 100, 'https://images.unsplash.com/photo-1546146830-2cca9512c68e?w=400', '海南文昌', '新鲜青椰，椰水清甜，椰肉嫩滑', '⭐⭐⭐', '清甜解渴,天然饮品', 'on'],
  [19, '海南芭蕉', 1, 4.8, '斤', 35, 'https://images.unsplash.com/photo-1571771894821-ce9b6a5f1d22?w=400', '海南五指山', '小米蕉，个头小甜度高', '⭐⭐⭐⭐', '小巧香甜,软糯可口', 'on'],
  [20, '海南杨桃', 1, 6.8, '斤', 20, 'https://images.unsplash.com/photo-1598681449190-3a776c1b413e?w=400', '海南琼海', '五角星水果，清甜多汁', '⭐⭐⭐', '清脆爽口,造型别致', 'on'],
];

for (const p of products) {
  insertProduct.run(...p);
}
console.log(`✅ ${products.length} 种水果商品已创建`);

// ========== 4. 创建几个示例用户 ==========
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, nickname, phone) VALUES (?, ?, ?)
`);
insertUser.run(1, '张三爱吃水果', '13847410001');
insertUser.run(2, '集宁李大姐', '13847410002');
insertUser.run(3, '果粉小王', '13847410003');
console.log('✅ 示例用户已创建');

// ========== 5. 创建示例订单（方便测试数据大屏）==========
const insertOrder = db.prepare(`
  INSERT OR IGNORE INTO orders (id, order_no, user_id, total_amount, status, pickup_point, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertOrderItem = db.prepare(`
  INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, quantity, price)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// 生成过去30天的模拟订单
const statuses = ['pending', 'paid', 'ready', 'done', 'done', 'done']; // 偏重已完成
const pickupPoints = ['乌兰察布集宁区解放大街123号一鸣鲜果', '乌兰察布集宁区工农路45号自提点'];

for (let i = 1; i <= 50; i++) {
  const daysAgo = Math.floor(Math.random() * 30); // 过去30天内随机
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().replace('T', ' ').substring(0, 19);

  const userId = Math.floor(Math.random() * 3) + 1; // 随机用户
  const productId = Math.floor(Math.random() * 20) + 1; // 随机水果
  const quantity = Math.floor(Math.random() * 5) + 1; // 1-5斤
  const product = products.find(p => p[0] === productId);
  const price = product ? product[3] : 9.9;
  const total = +(price * quantity).toFixed(2);
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  insertOrder.run(i, `YM${dateStr.substring(0, 10).replace(/-/g, '')}${String(i).padStart(3, '0')}`, userId, total, status, pickupPoints[i % 2], dateStr);

  insertOrderItem.run(i * 10 + 1, i, productId, product ? product[1] : '海南水果', quantity, price);
}

console.log('✅ 50条示例订单已创建（近30天）');

console.log('\n🎉 种子数据填充完成！');
console.log('📦 管理员: admin/123456  partner/123456');
console.log('📦 水果种类: ' + products.length + ' 种');
console.log('📦 示例订单: 50 条');
