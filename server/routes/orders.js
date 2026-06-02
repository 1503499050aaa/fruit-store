/**
 * 订单相关路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * 生成订单编号
 * 格式：YM + 日期 + 序号（如 YM20240601001）
 */
function generateOrderNo() {
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 900) + 100);
  return `YM${dateStr}${random}`;
}

/**
 * POST /api/orders
 * 用户下单（公开接口，不需要登录就能下单）
 * Body: { nickname, phone, items: [{product_id, quantity}], pickup_point, remark }
 */
router.post('/', (req, res) => {
  const { nickname, phone, items, pickup_point, remark } = req.body;

  // 参数校验
  if (!nickname || !nickname.trim()) {
    return res.json({ code: 400, message: '请输入您的微信名/昵称' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ code: 400, message: '购物车是空的，请先添加水果' });
  }

  // 使用事务确保订单和订单商品同时写入成功
  const createOrder = db.transaction(() => {
    // 1. 查找或创建用户
    let user = db.prepare('SELECT * FROM users WHERE nickname = ? AND phone = ?').get(nickname.trim(), phone || '');
    if (!user) {
      const result = db.prepare('INSERT INTO users (nickname, phone) VALUES (?, ?)').run(nickname.trim(), phone || '');
      user = { id: result.lastInsertRowid };
    }

    // 2. 计算总金额并校验库存
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(item.product_id, 'on');
      if (!product) {
        throw new Error(`商品ID ${item.product_id} 不存在或已下架`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`「${product.name}」库存不足，当前库存 ${product.stock} 斤`);
      }
      const itemTotal = +(product.price * item.quantity).toFixed(2);
      totalAmount += itemTotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }
    totalAmount = +totalAmount.toFixed(2);

    // 3. 创建订单
    const orderNo = generateOrderNo();
    const orderResult = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_amount, status, pickup_point, remark)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(orderNo, user.id, totalAmount, pickup_point || '乌兰察布集宁区解放大街123号一鸣鲜果', remark || '');

    const orderId = orderResult.lastInsertRowid;

    // 4. 写入订单商品
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const oi of orderItems) {
      insertItem.run(orderId, oi.product_id, oi.product_name, oi.quantity, oi.price);
    }

    // 5. 扣减库存
    const updateStock = db.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    for (const item of items) {
      updateStock.run(item.quantity, item.product_id);
    }

    // 6. 清空该用户的购物车
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user.id);

    return { orderId, orderNo, totalAmount, userId: user.id };
  });

  try {
    const result = createOrder();
    res.json({
      code: 200,
      message: '下单成功！',
      data: {
        order_id: result.orderId,
        order_no: result.orderNo,
        total_amount: result.totalAmount,
      },
    });
  } catch (err) {
    res.json({ code: 400, message: err.message });
  }
});

/**
 * GET /api/orders
 * 查询订单列表（用户端 - 按昵称和手机号查）
 * 后台用 - 查全部（需要登录）
 */
router.get('/', (req, res) => {
  const { nickname, phone, status, start_date, end_date, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT o.*, u.nickname, u.phone,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  // 用户端查询：按昵称+手机号
  if (nickname) {
    sql += ' AND u.nickname LIKE ?';
    params.push(`%${nickname}%`);
  }
  if (phone) {
    sql += ' AND u.phone = ?';
    params.push(phone);
  }
  // 状态筛选
  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }
  // 日期筛选
  if (start_date) {
    sql += ' AND o.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND o.created_at <= ?';
    params.push(end_date + ' 23:59:59');
  }

  // 查询总数
  const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
  const total = db.prepare(countSql).get(...params).total;

  // 分页
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const orders = db.prepare(sql).all(...params);

  // 组装订单商品明细
  const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const ordersWithItems = orders.map(order => ({
    ...order,
    items: getItems.all(order.id),
  }));

  res.json({
    code: 200,
    data: {
      list: ordersWithItems,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    },
  });
});

/**
 * GET /api/orders/:id
 * 获取单个订单详情
 */
router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.nickname, u.phone
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.json({ code: 404, message: '订单不存在' });
  }

  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ code: 200, data: order });
});

/**
 * PUT /api/orders/:id/status
 * 修改订单状态（后台操作，需要登录）
 * Body: { status: 'paid' | 'ready' | 'done' | 'cancelled' }
 */
router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['paid', 'ready', 'done', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.json({ code: 400, message: '无效的订单状态' });
  }

  // 如果取消订单，恢复库存
  if (status === 'cancelled') {
    const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.json({ code: 404, message: '订单不存在' });
    if (order.status === 'cancelled') return res.json({ code: 400, message: '订单已取消' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
    const restoreStock = db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    for (const item of items) {
      restoreStock.run(item.quantity, item.product_id);
    }
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ code: 200, message: '订单状态已更新' });
});

module.exports = router;
