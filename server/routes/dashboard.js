/**
 * 数据大屏相关路由 - 为后台首页提供统计数据
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 所有接口都需要登录
router.use(authMiddleware);

/**
 * GET /api/dashboard/today
 * 今日实时数据
 */
router.get('/today', (req, res) => {
  const today = new Date().toISOString().substring(0, 10); // 如 2024-06-01

  // 今日订单数和销售额
  const todayStats = db.prepare(`
    SELECT
      COUNT(*) as order_count,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_sales,
      COUNT(DISTINCT user_id) as user_count
    FROM orders
    WHERE date(created_at) = ?
  `).get(today);

  // 待处理订单数（pending + paid状态）
  const pendingCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'paid')
  `).get();

  // 库存预警商品（库存低于10的）
  const lowStockProducts = db.prepare(`
    SELECT id, name, stock, price FROM products
    WHERE status = 'on' AND stock < 10
    ORDER BY stock ASC
  `).all();

  res.json({
    code: 200,
    data: {
      today_order_count: todayStats.order_count,
      today_sales: todayStats.total_sales,
      today_user_count: todayStats.user_count,
      pending_order_count: pendingCount.count,
      low_stock_products: lowStockProducts,
    },
  });
});

/**
 * GET /api/dashboard/category-sales
 * 近7天各品类销量对比（柱状图数据）
 */
router.get('/category-sales', (req, res) => {
  const data = db.prepare(`
    SELECT c.name as category_name,
      COALESCE(SUM(oi.quantity), 0) as total_quantity,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_amount
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= datetime('now', '-7 days')
      AND o.status != 'cancelled'
    GROUP BY c.id
    ORDER BY total_quantity DESC
  `).all();

  res.json({ code: 200, data });
});

/**
 * GET /api/dashboard/top-products
 * 本周热销水果TOP5（饼图数据）
 */
router.get('/top-products', (req, res) => {
  const data = db.prepare(`
    SELECT p.name as product_name,
      COALESCE(SUM(oi.quantity), 0) as total_quantity,
      COALESCE(SUM(oi.quantity * oi.price), 0) as total_amount
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= datetime('now', '-7 days')
      AND o.status != 'cancelled'
    GROUP BY p.id
    ORDER BY total_quantity DESC
    LIMIT 5
  `).all();

  res.json({ code: 200, data });
});

/**
 * GET /api/dashboard/sales-trend
 * 近30天销售趋势（折线图数据）
 */
router.get('/sales-trend', (req, res) => {
  const data = db.prepare(`
    SELECT date(o.created_at) as date,
      COUNT(*) as order_count,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_sales
    FROM orders o
    WHERE o.created_at >= datetime('now', '-30 days')
    GROUP BY date(o.created_at)
    ORDER BY date ASC
  `).all();

  res.json({ code: 200, data });
});

/**
 * GET /api/dashboard/overview
 * 一次性返回所有大屏数据（减少请求次数）
 */
router.get('/overview', (req, res) => {
  const today = new Date().toISOString().substring(0, 10);

  // 今日统计
  const todayStats = db.prepare(`
    SELECT COUNT(*) as order_count, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_sales,
    COUNT(DISTINCT user_id) as user_count FROM orders WHERE date(created_at) = ?
  `).get(today);

  // 待处理
  const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'paid')`).get();

  // 库存预警
  const lowStock = db.prepare(`SELECT id, name, stock, price FROM products WHERE status = 'on' AND stock < 10 ORDER BY stock ASC`).all();

  // 7天品类销量
  const categorySales = db.prepare(`
    SELECT c.name as category_name, COALESCE(SUM(oi.quantity), 0) as total_quantity
    FROM categories c LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= datetime('now', '-7 days') AND o.status != 'cancelled'
    GROUP BY c.id ORDER BY total_quantity DESC
  `).all();

  // TOP5
  const topProducts = db.prepare(`
    SELECT p.name as product_name, COALESCE(SUM(oi.quantity), 0) as total_quantity
    FROM products p JOIN order_items oi ON p.id = oi.product_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= datetime('now', '-7 days') AND o.status != 'cancelled'
    GROUP BY p.id ORDER BY total_quantity DESC LIMIT 5
  `).all();

  // 30天趋势
  const salesTrend = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as order_count,
    COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_sales
    FROM orders WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at) ORDER BY date ASC
  `).all();

  res.json({
    code: 200,
    data: {
      today: { order_count: todayStats.order_count, total_sales: todayStats.total_sales, user_count: todayStats.user_count, pending_count: pendingCount.count },
      low_stock: lowStock,
      category_sales: categorySales,
      top_products: topProducts,
      sales_trend: salesTrend,
    },
  });
});

module.exports = router;
