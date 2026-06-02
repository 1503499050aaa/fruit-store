/**
 * 管理员相关路由 - 登录、注册等
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

/**
 * POST /api/admin/login
 * 管理员登录
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ code: 400, message: '请输入用户名和密码' });
  }

  // 查询管理员
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.json({ code: 400, message: '用户名或密码错误' });
  }

  // 验证密码
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash !== admin.password_hash) {
    return res.json({ code: 400, message: '用户名或密码错误' });
  }

  // 生成 token
  const token = generateToken(admin);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        role: admin.role,
      },
    },
  });
});

/**
 * GET /api/admin/info
 * 获取当前登录管理员信息
 */
router.get('/info', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    data: req.admin,
  });
});

module.exports = router;
