/**
 * 手机H5商城 - API 请求封装
 */
import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 响应拦截
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('请求失败:', error.message)
    return Promise.reject(error)
  }
)

// ========== 商品相关 ==========

/** 获取商品列表 */
export const getProducts = (params) => http.get('/products', { params })

/** 获取商品详情 */
export const getProduct = (id) => http.get(`/products/${id}`)

/** 获取分类列表 */
export const getCategories = () => http.get('/categories')

// ========== 购物车相关（后端存储，配合用户ID） ==========

/** 获取购物车 */
export const getCart = (user_id) => http.get('/cart', { params: { user_id } })

/** 加入购物车 */
export const addToCart = (data) => http.post('/cart', data)

/** 修改购物车数量 */
export const updateCartItem = (id, quantity) => http.put(`/cart/${id}`, { quantity })

/** 删除购物车商品 */
export const removeCartItem = (id) => http.delete(`/cart/${id}`)

/** 清空购物车 */
export const clearCart = (user_id) => http.delete(`/cart/clear/${user_id}`)

// ========== 订单相关 ==========

/** 下单 */
export const createOrder = (data) => http.post('/orders', data)

/** 查询订单（按昵称+手机号） */
export const getOrders = (params) => http.get('/orders', { params })

/** 获取订单详情 */
export const getOrder = (id) => http.get(`/orders/${id}`)

// ========== 用户相关 ==========

/** 用户注册/查找 */
export const findOrCreateUser = (data) => http.post('/users', data)

export default http
