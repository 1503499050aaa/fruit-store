/**
 * 管理员认证中间件
 * 使用 JWT（JSON Web Token）做登录态管理
 */
const jwt = require('jsonwebtoken');

// JWT 密钥（生产环境建议放在环境变量中）
const JWT_SECRET = 'yiming_fruit_store_2024_secret_key';

/**
 * 生成 JWT Token
 * @param {object} admin - 管理员信息 {id, username, display_name, role}
 * @returns {string} token，有效期7天
 */
function generateToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username, display_name: admin.display_name, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' } // 7天过期，不用天天登录
  );
}

/**
 * 验证 JWT Token 的中间件
 * 用在需要登录才能访问的路由上
 */
function authMiddleware(req, res, next) {
  // 从请求头里取 token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // 把管理员信息挂到 req 上，后续路由可以用
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

module.exports = { generateToken, authMiddleware, JWT_SECRET };
