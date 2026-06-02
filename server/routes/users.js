/**
 * 用户相关路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/users
 * 客户列表（后台用，需要登录）
 */
router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;

  let sql = `
    SELECT u.*,
      COUNT(o.id) as order_count,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE 1=1
  `;
  const params = [];

  if (keyword) {
    sql += ' AND (u.nickname LIKE ? OR u.phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' GROUP BY u.id ORDER BY total_spent DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const users = db.prepare(sql).all(...params);

  // 查总数
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const countParams = [];
  if (keyword) {
    countSql += ' AND (nickname LIKE ? OR phone LIKE ?)';
    countParams.push(`%${keyword}%`, `%${keyword}%`);
  }
  const total = db.prepare(countSql).get(...countParams).total;

  res.json({
    code: 200,
    data: {
      list: users,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    },
  });
});

/**
 * GET /api/users/export
 * 导出客户Excel（简化版，导出JSON数据，可在Excel中打开）
 */
router.get('/export', authMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT u.nickname as '微信名', u.phone as '手机号',
      COUNT(o.id) as '下单次数',
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as '累计消费金额',
      u.created_at as '注册时间'
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id
    ORDER BY 累计消费金额 DESC
  `).all();

  // 转成 CSV 格式（Excel可以直接打开）
  const headers = Object.keys(users[0] || {});
  let csv = '﻿' + headers.join(',') + '\n'; // ﻿ 是BOM，让Excel正确识别中文
  for (const row of users) {
    csv += Object.values(row).map(v => `"${v || ''}"`).join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=客户数据.csv');
  res.send(csv);
});

/**
 * POST /api/users
 * 用户注册/查找（公开接口）
 * Body: { nickname, phone }
 * 如果用户已存在就返回已有用户，不存在就创建
 */
router.post('/', (req, res) => {
  const { nickname, phone } = req.body;
  if (!nickname || !nickname.trim()) {
    return res.json({ code: 400, message: '请输入昵称' });
  }

  let user = db.prepare('SELECT * FROM users WHERE nickname = ? AND phone = ?').get(nickname.trim(), phone || '');
  if (!user) {
    const result = db.prepare('INSERT INTO users (nickname, phone) VALUES (?, ?)').run(nickname.trim(), phone || '');
    user = { id: result.lastInsertRowid, nickname: nickname.trim(), phone: phone || '' };
  }

  res.json({ code: 200, data: user });
});

module.exports = router;
