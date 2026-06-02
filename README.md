# 🍍 一鸣鲜果 - 海南直发水果商城

> 专为乌兰察布集宁区水果店定制，海南直发，手机下单，数据管理

## 🚀 快速启动

```bash
# 第一步：初始化（第一次运行才需要）
cd server && npm install && node seed.js && cd ..

# 第二步：启动服务
bash start.sh

# 第三步：打开浏览器
# 手机商城：http://localhost:3456/web
# 商家后台：http://localhost:3456/admin
```

## 📁 项目结构

```
fruit-store/
├── server/          # 后端 API（Node.js + Express + SQLite）
│   ├── routes/      # 接口路由
│   ├── middleware/   # 中间件（登录验证）
│   ├── db.js        # 数据库初始化
│   ├── seed.js      # 种子数据
│   └── index.js     # 服务入口
├── admin/           # 商家后台（Vue3 + Element Plus + ECharts）
│   └── src/views/   # 页面组件
├── web/             # 手机H5商城（Vue3 + Vant）
│   └── src/views/   # 页面组件
└── 小白部署手册.md   # 部署教程
```

## 🔑 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 老板 | admin | 123456 |
| 合伙人 | partner | 123456 |

## 📱 功能一览

### 手机商城（用户端）
- ✅ 首页轮播图 + 水果分类 + 商品网格
- ✅ 商品详情（图片、价格、甜度、产地）
- ✅ 购物车（增删改查）
- ✅ 下单结算（模拟支付）
- ✅ 我的订单（按状态筛选）
- ✅ 联系店家 / 查看自提点

### 商家后台（管理端）
- ✅ 数据大屏（统计卡片 + 柱状图 + 饼图 + 折线图 + 库存预警）
- ✅ 订单管理（筛选 / 状态流转 / 取消恢复库存）
- ✅ 商品管理（上架下架 / 增删改查）
- ✅ 客户管理（消费统计 / 导出CSV）

## 🛠 技术栈

- 后端：Node.js + Express + SQLite (better-sqlite3)
- 后台：Vue 3 + Element Plus + ECharts + Vite
- 商城：Vue 3 + Vant 4 + Vite
- 认证：JWT (jsonwebtoken)

## 📦 部署

详见 [小白部署手册.md](./小白部署手册.md)（零基础也能看懂）
