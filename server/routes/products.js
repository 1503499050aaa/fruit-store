/**
 * 商品（水果）相关路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/products
 * 获取商品列表（公开接口）
 * 支持筛选：?category_id=1&status=on&keyword=芒果
 */
router.get('/', (req, res) => {
  const { category_id, status, keyword } = req.query;

  let sql = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const params = [];

  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  if (keyword) {
    sql += ' AND p.name LIKE ?';
    params.push(`%${keyword}%`);
  }

  sql += ' ORDER BY p.created_at DESC';
  const products = db.prepare(sql).all(...params);
  res.json({ code: 200, data: products });
});

/**
 * GET /api/products/:id
 * 获取单个商品详情（公开接口）
 */
router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) {
    return res.json({ code: 404, message: '商品不存在' });
  }
  res.json({ code: 200, data: product });
});

/**
 * POST /api/products
 * 新增商品（需要登录）
 */
router.post('/', authMiddleware, (req, res) => {
  const { name, category_id, price, stock, image_url, origin, description, sweetness, taste_tags, unit } = req.body;

  if (!name || !category_id || !price) {
    return res.json({ code: 400, message: '请填写商品名称、分类和价格' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, category_id, price, unit, stock, image_url, origin, description, sweetness, taste_tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'on')
  `).run(name, category_id, price, unit || '斤', stock || 0, image_url || '', origin || '海南', description || '', sweetness || '', taste_tags || '');

  res.json({ code: 200, message: '商品添加成功', data: { id: result.lastInsertRowid } });
});

/**
 * PUT /api/products/:id
 * 修改商品（需要登录）
 */
router.put('/:id', authMiddleware, (req, res) => {
  const { name, category_id, price, unit, stock, image_url, origin, description, sweetness, taste_tags, status } = req.body;

  db.prepare(`
    UPDATE products SET name=?, category_id=?, price=?, unit=?, stock=?, image_url=?, origin=?, description=?, sweetness=?, taste_tags=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name, category_id, price, unit, stock, image_url, origin, description, sweetness, taste_tags, status, req.params.id);

  res.json({ code: 200, message: '商品修改成功' });
});

/**
 * PUT /api/products/batch/stock
 * 批量修改库存（需要登录）
 * Body: { items: [{id: 1, stock: 50}, {id: 2, stock: 30}] }
 */
router.put('/batch/stock', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.json({ code: 400, message: '请提供商品库存列表' });
  }

  const updateStmt = db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const batchUpdate = db.transaction((items) => {
    for (const item of items) {
      updateStmt.run(item.stock, item.id);
    }
  });

  batchUpdate(items);
  res.json({ code: 200, message: `成功更新 ${items.length} 个商品的库存` });
});

/**
 * DELETE /api/products/:id
 * 删除商品（需要登录）
 */
router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ code: 200, message: '商品已删除' });
});

module.exports = router;
