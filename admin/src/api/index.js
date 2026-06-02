/**
 * API 请求封装 - 基于 axios
 * 统一管理所有后端接口调用
 */
import axios from 'axios'

// 创建 axios 实例，设置默认基础地址
const http = axios.create({
  baseURL: '/api', // 所有请求都以 /api 开头（开发时 Vite 代理到后端，部署时 Express 直接托管）
  timeout: 10000,  // 超时时间 10 秒
})

/**
 * 请求拦截器 - 自动在请求头里加 token
 */
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 响应拦截器 - 统一处理错误
 */
http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 401) {
      // token 失效，清除登录态并跳转登录页
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      window.location.hash = '#/login'
    }
    return res
  },
  (error) => {
    console.error('网络请求失败:', error.message)
    return Promise.reject(error)
  }
)

// ========== 管理员相关 ==========

/** 管理员登录 */
export const adminLogin = (username, password) =>
  http.post('/admin/login', { username, password })

/** 获取当前管理员信息 */
export const getAdminInfo = () => http.get('/admin/info')

// ========== 数据大屏 ==========

/** 获取大屏全部数据（一次请求拿完） */
export const getDashboardOverview = () => http.get('/dashboard/overview')

// ========== 商品管理 ==========

/** 获取商品列表 */
export const getProducts = (params) => http.get('/products', { params })

/** 获取单个商品详情 */
export const getProduct = (id) => http.get(`/products/${id}`)

/** 新增商品 */
export const createProduct = (data) => http.post('/products', data)

/** 修改商品 */
export const updateProduct = (id, data) => http.put(`/products/${id}`, data)

/** 删除商品 */
export const deleteProduct = (id) => http.delete(`/products/${id}`)

/** 批量修改库存 */
export const batchUpdateStock = (items) => http.put('/products/batch/stock', { items })

// ========== 分类管理 ==========

/** 获取分类列表 */
export const getCategories = () => http.get('/categories')

// ========== 订单管理 ==========

/** 获取订单列表 */
export const getOrders = (params) => http.get('/orders', { params })

/** 获取单个订单详情 */
export const getOrder = (id) => http.get(`/orders/${id}`)

/** 修改订单状态 */
export const updateOrderStatus = (id, status) =>
  http.put(`/orders/${id}/status`, { status })

// ========== 客户管理 ==========

/** 获取客户列表 */
export const getUsers = (params) => http.get('/users', { params })

/** 导出客户数据（返回CSV文本） */
export const exportUsers = () => http.get('/users/export')

export default http
