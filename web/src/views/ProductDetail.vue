<template>
  <!-- 商品详情页 -->
  <div class="detail-page">
    <!-- 返回按钮 -->
    <van-nav-bar title="商品详情" left-arrow @click-left="$router.back()" />

    <!-- 商品大图 -->
    <div class="detail-img-wrap">
      <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="detail-img" />
      <span v-else class="detail-img-placeholder">{{ getFruitEmoji(product.name) }}</span>
    </div>

    <!-- 商品基本信息 -->
    <div class="detail-section">
      <h2 class="detail-name">{{ product.name }}</h2>
      <div class="detail-tags">
        <span class="tag-item">📍 {{ product.origin }}</span>
        <span v-if="product.sweetness" class="tag-item">🍬 {{ product.sweetness }}</span>
        <span v-if="product.taste_tags" class="tag-item">👅 {{ product.taste_tags }}</span>
      </div>
      <div class="detail-price-row">
        <span class="detail-price">¥{{ product.price }}</span>
        <span class="detail-unit">/{{ product.unit }}</span>
        <span v-if="product.stock <= 10 && product.stock > 0" class="stock-low">仅剩 {{ product.stock }} {{ product.unit }}</span>
        <span v-if="product.stock === 0" class="stock-none">已售罄</span>
      </div>
    </div>

    <!-- 规格选择（数量） -->
    <div class="detail-section">
      <div class="section-title">购买数量</div>
      <div class="qty-selector">
        <van-stepper v-model="quantity" :min="1" :max="Math.min(product.stock, 99)" :disabled="product.stock === 0" />
        <span class="qty-tip">库存 {{ product.stock }} {{ product.unit }}</span>
      </div>
    </div>

    <!-- 商品描述 -->
    <div class="detail-section" v-if="product.description">
      <div class="section-title">商品描述</div>
      <p class="detail-desc">{{ product.description }}</p>
    </div>

    <!-- 物流信息 -->
    <div class="detail-section">
      <div class="section-title">📦 物流信息</div>
      <p class="detail-desc">✈️ 海南空运直达乌兰察布，预计 <strong>2-3天</strong> 到货</p>
      <p class="detail-desc">📍 自提地址：乌兰察布集宁区解放大街123号一鸣鲜果</p>
    </div>

    <!-- 底部操作栏 -->
    <div class="detail-footer">
      <van-button
        type="primary"
        size="large"
        round
        color="#07c160"
        block
        :disabled="product.stock === 0"
        @click="addToCart"
      >
        加入购物车
      </van-button>
      <van-button
        type="danger"
        size="large"
        round
        block
        :disabled="product.stock === 0"
        @click="buyNow"
        style="margin-top: 8px;"
      >
        立即购买
      </van-button>
    </div>
  </div>
</template>

<script setup>
/**
 * 商品详情页 - 大图、价格、规格、加入购物车、立即购买
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { getProduct } from '../api'

const route = useRoute()
const router = useRouter()
const product = ref({})
const quantity = ref(1)

/** 根据名称返回 emoji */
function getFruitEmoji(name) {
  if (!name) return '🍎'
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
  return '🍎'
}

/** 加载商品详情 */
async function loadProduct() {
  const res = await getProduct(route.params.id)
  if (res.code === 200) {
    product.value = res.data
  } else {
    showToast('商品不存在')
    router.back()
  }
}

/** 加入购物车 */
function addToCart() {
  const cart = JSON.parse(localStorage.getItem('cart_items') || '[]')
  const existing = cart.find(item => item.product_id === product.value.id)
  if (existing) {
    existing.quantity += quantity.value
  } else {
    cart.push({
      product_id: product.value.id,
      product_name: product.value.name,
      price: product.value.price,
      image_url: product.value.image_url,
      stock: product.value.stock,
      quantity: quantity.value,
    })
  }
  localStorage.setItem('cart_items', JSON.stringify(cart))
  showSuccessToast('已加入购物车')
}

/** 立即购买 */
function buyNow() {
  // 先加入购物车，然后跳转结算页
  const cart = JSON.parse(localStorage.getItem('cart_items') || '[]')
  const existing = cart.find(item => item.product_id === product.value.id)
  if (existing) {
    existing.quantity = quantity.value
  } else {
    cart.push({
      product_id: product.value.id,
      product_name: product.value.name,
      price: product.value.price,
      image_url: product.value.image_url,
      stock: product.value.stock,
      quantity: quantity.value,
    })
  }
  localStorage.setItem('cart_items', JSON.stringify(cart))
  router.push('/cart')
}

onMounted(() => loadProduct())
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.detail-img-wrap {
  width: 100%;
  height: 280px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-img-placeholder {
  font-size: 100px;
}

.detail-section {
  background: #fff;
  padding: 16px;
  margin-top: 10px;
}

.detail-name {
  font-size: 20px;
  color: #333;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag-item {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
}

.detail-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 12px;
}

.detail-price {
  font-size: 28px;
  font-weight: bold;
  color: #ff6b6b;
}

.detail-unit {
  font-size: 14px;
  color: #999;
}

.stock-low {
  font-size: 12px;
  color: #ff6b6b;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.stock-none {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.qty-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.qty-tip {
  font-size: 13px;
  color: #999;
}

.detail-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 4px;
}

.detail-footer {
  padding: 16px;
  background: #fff;
  position: sticky;
  bottom: 50px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
}
</style>
