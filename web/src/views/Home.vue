<template>
  <!-- 首页：轮播图 + 分类标签 + 水果列表 -->
  <div class="home-page">
    <!-- 顶部店名 -->
    <div class="store-header">
      <h1 class="store-name">🍍 一鸣鲜果</h1>
      <p class="store-slogan">✈️ 今日海南 · 明日餐桌</p>
      <p class="store-desc">海南直发 · 空运直达 · 新鲜到家</p>
    </div>

    <!-- 轮播图 - 当季爆款 -->
    <van-swipe :autoplay="3000" indicator-color="#07c160" class="banner-swipe">
      <van-swipe-item v-for="(banner, i) in banners" :key="i">
        <div class="banner-item" :style="{ background: banner.bg }">
          <div class="banner-text">
            <div class="banner-title">{{ banner.title }}</div>
            <div class="banner-sub">{{ banner.sub }}</div>
          </div>
          <span class="banner-emoji">{{ banner.emoji }}</span>
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 商品分类标签 -->
    <div class="category-tabs">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: activeCategory === cat.id }"
        @click="switchCategory(cat.id)"
      >
        {{ getCatEmoji(cat.name) }} {{ cat.name }}
      </div>
    </div>

    <!-- 水果列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <van-loading size="24" color="#07c160" />
        <p style="color: #999; margin-top: 8px;">加载中...</p>
      </div>

      <div v-else class="product-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="goDetail(product.id)"
        >
          <!-- 商品图片 -->
          <div class="product-img-wrap">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-img" />
            <span v-else class="product-img-placeholder">{{ getFruitEmoji(product.name) }}</span>
            <!-- 库存紧张标签 -->
            <div v-if="product.stock > 0 && product.stock < 10" class="stock-warning">库存紧张</div>
            <div v-if="product.stock === 0" class="sold-out">已售罄</div>
          </div>
          <!-- 商品信息 -->
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-tags">
              <span class="tag-origin">{{ product.origin }}</span>
              <span v-if="product.sweetness" class="tag-sweet">{{ product.sweetness }}</span>
            </div>
            <div class="product-bottom">
              <span class="product-price">
                <span class="price-symbol">¥</span>{{ product.price }}
                <span class="price-unit">/{{ product.unit }}</span>
              </span>
              <van-button
                type="primary"
                size="small"
                round
                color="#07c160"
                :disabled="product.stock === 0"
                @click.stop="addToCartLocal(product)"
              >
                +
              </van-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <van-empty v-if="!loading && products.length === 0" description="该分类暂无可售水果" />
    </van-pull-refresh>
  </div>
</template>

<script setup>
/**
 * 首页 - 轮播图、分类筛选、水果商品列表
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getProducts, getCategories, getCart, addToCart } from '../api'

const router = useRouter()
const products = ref([])
const categories = ref([])
const activeCategory = ref(0) // 0=全部
const loading = ref(false)
const refreshing = ref(false)

// 用户ID（简化版：存localStorage）
const userId = ref(Number(localStorage.getItem('user_id') || 0))

// 轮播图数据
const banners = [
  { title: '海南贵妃芒', sub: '新鲜空运 甜过初恋', bg: 'linear-gradient(135deg, #ff9a56, #ff6b6b)', emoji: '🥭' },
  { title: '金枕榴莲', sub: '果肉金黄 软糯香甜', bg: 'linear-gradient(135deg, #f5d25e, #e8a840)', emoji: '🍈' },
  { title: '海南麒麟瓜', sub: '皮薄肉红 清甜解暑', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', emoji: '🍉' },
]

/** 根据分类名返回 emoji */
function getCatEmoji(name) {
  const map = { '热带水果': '🥭', '柑橘类': '🍊', '浆果类': '🍇', '瓜类': '🍉' }
  return map[name] || '🍎'
}

/** 根据水果名返回 emoji */
function getFruitEmoji(name) {
  if (name.includes('芒果')) return '🥭'
  if (name.includes('榴莲')) return '🍈'
  if (name.includes('菠萝蜜')) return '🍍'
  if (name.includes('火龙果')) return '🐉'
  if (name.includes('椰子')) return '🥥'
  if (name.includes('瓜')) return '🍉'
  if (name.includes('柠檬')) return '🍋'
  if (name.includes('橙') || name.includes('柑')) return '🍊'
  if (name.includes('草莓')) return '🍓'
  if (name.includes('蓝莓')) return '🫐'
  if (name.includes('百香果')) return '🟡'
  if (name.includes('山竹')) return '🟤'
  if (name.includes('莲雾')) return '🔴'
  if (name.includes('红毛丹')) return '🔴'
  if (name.includes('芭蕉')) return '🍌'
  if (name.includes('杨桃')) return '⭐'
  return '🍎'
}

/** 切换分类 */
function switchCategory(catId) {
  activeCategory.value = catId
  loadProducts()
}

/** 去商品详情页 */
function goDetail(id) {
  router.push(`/product/${id}`)
}

/** 加载商品 */
async function loadProducts() {
  loading.value = true
  try {
    const params = { status: 'on' }
    if (activeCategory.value > 0) params.category_id = activeCategory.value
    const res = await getProducts(params)
    if (res.code === 200) {
      products.value = res.data
    }
  } catch (err) {
    console.error('加载商品失败:', err)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/** 下拉刷新 */
function onRefresh() {
  refreshing.value = true
  loadProducts()
}

/** 加入购物车（本地存储版本 - 简单快速） */
function addToCartLocal(product) {
  if (product.stock === 0) {
    showToast('已售罄')
    return
  }
  // 读取现有购物车
  const cart = JSON.parse(localStorage.getItem('cart_items') || '[]')
  const existing = cart.find(item => item.product_id === product.id)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      quantity: 1,
    })
  }
  localStorage.setItem('cart_items', JSON.stringify(cart))
  showSuccessToast('已加入购物车')
}

/** 加载分类 */
async function loadCategories() {
  const res = await getCategories()
  if (res.code === 200) {
    categories.value = res.data
  }
}

onMounted(() => {
  // 如果没有用户ID，默认用1
  if (!localStorage.getItem('user_id')) {
    localStorage.setItem('user_id', '1')
    localStorage.setItem('user_nickname', '果粉')
    userId.value = 1
  }
  loadProducts()
  loadCategories()
})
</script>

<style scoped>
/* 顶部店铺 */
.store-header {
  text-align: center;
  padding: 20px 16px 12px;
  background: linear-gradient(135deg, #e8f5e9, #fff);
}

.store-name {
  font-size: 24px;
  color: #333;
  margin-bottom: 4px;
}

.store-slogan {
  font-size: 15px;
  color: #07c160;
  font-weight: 600;
  margin-bottom: 2px;
}

.store-desc {
  font-size: 12px;
  color: #999;
}

/* 轮播图 */
.banner-swipe {
  margin: 0 12px;
  border-radius: 12px;
  overflow: hidden;
}

.banner-item {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  color: #fff;
}

.banner-title {
  font-size: 22px;
  font-weight: bold;
}

.banner-sub {
  font-size: 14px;
  margin-top: 4px;
  opacity: 0.9;
}

.banner-emoji {
  font-size: 60px;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  padding: 14px 12px;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category-tab {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  background: #fff;
  color: #666;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab.active {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两列布局 */
  gap: 10px;
  padding: 0 12px 20px;
}

.product-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.98);
}

.product-img-wrap {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-img-placeholder {
  font-size: 56px;
}

.stock-warning {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #ff6b6b;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
}

.sold-out {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}

.product-info {
  padding: 10px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tag-origin, .tag-sweet {
  font-size: 10px;
  color: #999;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 4px;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  color: #ff6b6b;
  font-size: 18px;
  font-weight: bold;
}

.price-symbol {
  font-size: 12px;
}

.price-unit {
  font-size: 11px;
  font-weight: normal;
  color: #999;
}
</style>
