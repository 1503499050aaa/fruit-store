<template>
  <!-- 购物车页 -->
  <div class="cart-page">
    <van-nav-bar title="购物车" />

    <!-- 空购物车 -->
    <van-empty v-if="cartItems.length === 0" description="购物车是空的" image="search">
      <van-button type="primary" round color="#07c160" to="/">去逛逛</van-button>
    </van-empty>

    <!-- 购物车列表 -->
    <div v-else class="cart-list">
      <van-swipe-cell v-for="item in cartItems" :key="item.product_id">
        <div class="cart-item" @click="$router.push(`/product/${item.product_id}`)">
          <div class="cart-item-img-wrap">
            <img v-if="item.image_url" :src="item.image_url" class="cart-item-img" />
            <span v-else class="cart-item-placeholder">🍎</span>
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.product_name }}</div>
            <div class="cart-item-price">¥{{ item.price }}/斤</div>
          </div>
          <div class="cart-item-qty">
            <van-stepper
              v-model="item.quantity"
              :min="1"
              :max="item.stock"
              @change="saveCart"
              @click.stop
            />
          </div>
        </div>
        <template #right>
          <van-button square type="danger" text="删除" @click="removeItem(item.product_id)" style="height: 100%;" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 底部结算栏 -->
    <div v-if="cartItems.length > 0" class="cart-footer">
      <div class="cart-total">
        <span>合计：</span>
        <span class="total-amount">¥{{ totalAmount }}</span>
      </div>
      <van-button type="primary" round color="#07c160" size="large" @click="checkout">
        去结算（{{ totalCount }}件）
      </van-button>
    </div>
  </div>
</template>

<script setup>
/**
 * 购物车页 - 增删改商品、去结算
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const cartItems = ref([])

// 计算总金额
const totalAmount = computed(() => {
  const sum = cartItems.value.reduce((s, item) => s + item.price * item.quantity, 0)
  return sum.toFixed(2)
})

// 计算总件数
const totalCount = computed(() => {
  return cartItems.value.reduce((s, item) => s + item.quantity, 0)
})

/** 加载购物车 */
function loadCart() {
  cartItems.value = JSON.parse(localStorage.getItem('cart_items') || '[]')
}

/** 保存购物车到 localStorage */
function saveCart() {
  localStorage.setItem('cart_items', JSON.stringify(cartItems.value))
}

/** 删除商品 */
function removeItem(productId) {
  cartItems.value = cartItems.value.filter(item => item.product_id !== productId)
  saveCart()
  showToast('已删除')
}

/** 去结算 */
function checkout() {
  router.push('/checkout')
}

onMounted(() => loadCart())
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.cart-list {
  padding: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
}

.cart-item-img-wrap {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-placeholder {
  font-size: 36px;
}

.cart-item-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.cart-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.cart-item-price {
  font-size: 13px;
  color: #ff6b6b;
  margin-top: 4px;
}

.cart-item-qty {
  flex-shrink: 0;
  margin-left: 8px;
}

.cart-footer {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
  z-index: 100;
}

.cart-total {
  font-size: 14px;
  color: #333;
}

.total-amount {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b6b;
}
</style>
