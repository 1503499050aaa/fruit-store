/**
 * 商品分类相关路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/categories
 * 获取所有分类（公开接口，用户端也需要）
 */
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json({ code: 200, data: categories });
});

/**
 * POST /api/categories
 * 新增分类（需要登录）
 */
router.post('/', authMiddleware, (req, res) => {
  const { name, sort_order } = req.body;
  if (!name) {
    return res.json({ code: 400, message: '请输入分类名称' });
  }

  try {
    const result = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, sort_order || 0);
    res.json({ code: 200, message: '分类添加成功', data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.json({ code: 500, message: '分类名称重复或数据库错误' });
  }
});

/**
 * PUT /api/categories/:id
 * 修改分类（需要登录）
 */
router.put('/:id', authMiddleware, (req, res) => {
  const { name, sort_order } = req.body;
  db.prepare('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?').run(name, sort_order, req.params.id);
  res.json({ code: 200, message: '分类修改成功' });
});

/**
 * DELETE /api/categories/:id
 * 删除分类（需要登录）
 */
router.delete('/:id', authMiddleware, (req, res) => {
  // 先检查分类下是否有商品
  const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(req.params.id);
  if (count.count > 0) {
    return res.json({ code: 400, message: `该分类下有 ${count.count} 个商品，请先删除商品再删除分类` });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ code: 200, message: '分类删除成功' });
});

module.exports = router;
