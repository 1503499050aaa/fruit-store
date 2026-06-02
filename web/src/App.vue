<template>
  <!-- 手机H5商城根组件 -->
  <div class="app-container">
    <!-- 页面内容（带过渡动画） -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 底部导航栏（首页/购物车/我的） -->
    <van-tabbar v-model="activeTab" route active-color="#07c160" inactive-color="#999" safe-area-inset-bottom>
      <van-tabbar-item icon="shop-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="cart-o" to="/cart" :badge="cartBadge > 0 ? cartBadge : ''">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/mine">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
/**
 * App.vue - 手机H5商城主框架
 * 包含底部导航栏和页面路由切换
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeTab = ref(0)

// 根据当前路由设置底部导航高亮
const tabRoutes = ['/', '/cart', '/mine']

// 购物车数量（简化版：从 localStorage 读取）
const cartItems = ref(JSON.parse(localStorage.getItem('cart_items') || '[]'))
const cartBadge = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0))

// 监听路由变化
onMounted(() => {
  // 定期检查购物车变化
  setInterval(() => {
    cartItems.value = JSON.parse(localStorage.getItem('cart_items') || '[]')
  }, 2000)
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
  background: #f7f8fa;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  max-width: 480px; /* 限制最大宽度，模拟手机屏幕 */
  margin: 0 auto;
  min-height: 100vh;
  background: #f7f8fa;
  position: relative;
  padding-bottom: 50px; /* 给底部导航栏留空间 */
}

/* 页面切换动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
