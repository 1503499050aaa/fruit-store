/**
 * 购物车相关路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');

/**
 * GET /api/cart?user_id=1
 * 获取用户的购物车列表
 */
router.get('/', (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.json({ code: 400, message: '请先填写昵称进入商城' });
  }

  const items = db.prepare(`
    SELECT ci.*, p.name as product_name, p.price, p.image_url, p.stock, p.status
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC
  `).all(user_id);

  res.json({ code: 200, data: items });
});

/**
 * POST /api/cart
 * 加入购物车
 * Body: { user_id, product_id, quantity }
 */
router.post('/', (req, res) => {
  const { user_id, product_id, quantity = 1 } = req.body;

  if (!user_id || !product_id) {
    return res.json({ code: 400, message: '参数不完整' });
  }

  // 检查商品是否存在且已上架
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'on');
  if (!product) {
    return res.json({ code: 400, message: '商品不存在或已下架' });
  }

  // 检查购物车是否已有同款商品
  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(user_id, product_id);
  if (existing) {
    // 已有同款，数量叠加
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(user_id, product_id, quantity);
  }

  res.json({ code: 200, message: '已加入购物车' });
});

/**
 * PUT /api/cart/:id
 * 修改购物车商品数量
 * Body: { quantity }
 */
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) {
    // 数量为0或负数就删除
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    return res.json({ code: 200, message: '已移出购物车' });
  }
  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.id);
  res.json({ code: 200, message: '数量已更新' });
});

/**
 * DELETE /api/cart/:id
 * 删除购物车中的商品
 */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
  res.json({ code: 200, message: '已移出购物车' });
});

/**
 * DELETE /api/cart/clear/:user_id
 * 清空用户购物车
 */
router.delete('/clear/:user_id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.params.user_id);
  res.json({ code: 200, message: '购物车已清空' });
});

module.exports = router;
