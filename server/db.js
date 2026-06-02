/**
 * 数据库初始化模块 - 使用 SQLite（零配置，单文件数据库）
 * better-sqlite3: 同步API，比异步的sqlite3更快更简单
 */
const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件就存在 server 目录下，叫 fruit.db
const dbPath = path.join(__dirname, 'fruit.db');
const db = new Database(dbPath);

// 开启 WAL 模式，提升并发读取性能
db.pragma('journal_mode = WAL');
// 开启外键约束
db.pragma('foreign_keys = ON');

/**
 * 初始化所有数据库表
 * 如果表已存在则跳过（CREATE TABLE IF NOT EXISTS）
 */
function initDB() {
  // ========== 1. 管理员表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,       -- 登录用户名
      password_hash TEXT NOT NULL,         -- 密码的 SHA256 哈希
      display_name TEXT NOT NULL,          -- 显示名称
      role TEXT DEFAULT 'admin',           -- 角色：admin=超级管理员, operator=运营
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ========== 2. 商品分类表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,           -- 分类名称（如：热带水果）
      sort_order INTEGER DEFAULT 0,        -- 排序序号，数字越小越靠前
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ========== 3. 商品表（水果信息）==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,                  -- 水果名称
      category_id INTEGER NOT NULL,        -- 所属分类ID
      price REAL NOT NULL,                 -- 单价（元/斤）
      unit TEXT DEFAULT '斤',              -- 计价单位
      stock INTEGER DEFAULT 0,             -- 库存数量（斤）
      image_url TEXT DEFAULT '',           -- 水果图片URL
      origin TEXT DEFAULT '海南',          -- 产地（如：海南三亚）
      description TEXT DEFAULT '',         -- 商品描述
      sweetness TEXT DEFAULT '',           -- 甜度描述（如：⭐⭐⭐⭐）
      taste_tags TEXT DEFAULT '',          -- 口感标签（如：汁多味甜）
      status TEXT DEFAULT 'on',            -- 状态：on=上架, off=下架
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // ========== 4. 用户表（微信用户/手机号用户）==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT DEFAULT '',              -- 微信openid（小程序用，H5阶段留空）
      nickname TEXT NOT NULL,              -- 用户昵称/微信名
      phone TEXT DEFAULT '',               -- 手机号
      avatar_url TEXT DEFAULT '',          -- 头像URL
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ========== 5. 订单表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,       -- 订单编号（如：YM20240601001）
      user_id INTEGER NOT NULL,            -- 下单用户ID
      total_amount REAL NOT NULL,          -- 订单总金额
      status TEXT DEFAULT 'pending',       -- 状态：pending=待付款, paid=待发货, ready=待自提, done=已完成, cancelled=已取消
      pickup_point TEXT DEFAULT '',        -- 自提点地址
      remark TEXT DEFAULT '',              -- 用户备注
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ========== 6. 订单商品关联表 ==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,           -- 所属订单ID
      product_id INTEGER NOT NULL,         -- 商品ID
      product_name TEXT NOT NULL,          -- 下单时的商品名称（快照，防止改名后历史订单显示错误）
      quantity INTEGER NOT NULL,           -- 购买数量
      price REAL NOT NULL,                 -- 下单时的单价
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // ========== 7. 购物车表（存在数据库里，用户换手机也能看到）==========
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,            -- 用户ID
      product_id INTEGER NOT NULL,         -- 商品ID
      quantity INTEGER NOT NULL DEFAULT 1, -- 数量
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  console.log('✅ 数据库表初始化完成');
}

// 导出 db 实例和初始化函数
module.exports = { db, initDB };
