/**
 * 商家后台 - 路由配置
 * 控制页面跳转和登录鉴权
 */
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    // 登录页不需要侧边栏布局
    meta: { noLayout: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据大屏' },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue'),
    meta: { title: '订单管理' },
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Products.vue'),
    meta: { title: '商品管理' },
  },
  {
    path: '/customers',
    name: 'Customers',
    component: () => import('../views/Customers.vue'),
    meta: { title: '客户管理' },
  },
]

const router = createRouter({
  history: createWebHashHistory(), // 用 hash 模式，不需要服务器端配置
  routes,
})

/**
 * 路由守卫 - 检查是否已登录
 * 没登录就跳转到登录页
 */
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    // 没登录，强制跳转登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录，访问登录页就重定向到首页
    next('/dashboard')
  } else {
    next()
  }
})

export default router
