<template>
  <!-- 我的订单页 -->
  <div class="orders-page">
    <van-nav-bar title="我的订单" />

    <!-- 订单状态 Tab -->
    <van-tabs v-model:active="activeTab" @change="loadOrders" sticky>
      <van-tab title="全部" name="" />
      <van-tab title="待付款" name="pending" />
      <van-tab title="待发货" name="paid" />
      <van-tab title="待自提" name="ready" />
      <van-tab title="已完成" name="done" />
    </van-tabs>

    <!-- 订单列表 -->
    <div v-if="loading" style="text-align:center;padding:40px;">
      <van-loading size="24" color="#07c160" />
    </div>

    <van-empty v-else-if="orders.length === 0" description="暂无订单">
      <van-button type="primary" round color="#07c160" to="/">去逛逛</van-button>
    </van-empty>

    <div v-else class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <!-- 订单头 -->
        <div class="order-header">
          <span class="order-no">{{ order.order_no }}</span>
          <van-tag :type="statusType(order.status)" size="small">{{ statusText(order.status) }}</van-tag>
        </div>
        <!-- 订单商品 -->
        <div v-for="item in order.items" :key="item.id" class="order-product">
          <span class="op-name">{{ item.product_name }}</span>
          <span class="op-right">×{{ item.quantity }} ¥{{ item.price }}/斤</span>
        </div>
        <!-- 订单尾 -->
        <div class="order-footer">
          <span class="order-time">{{ order.created_at }}</span>
          <span class="order-amount">合计：<strong>¥{{ order.total_amount }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 我的订单页 - 按状态筛选查看订单
 */
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getOrders } from '../api'

const orders = ref([])
const activeTab = ref('')
const loading = ref(false)

const statusMap = {
  pending: { text: '待付款', type: 'warning' },
  paid: { text: '待发货', type: 'info' },
  ready: { text: '待自提', type: '' },
  done: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'danger' },
}

function statusText(status) { return statusMap[status]?.text || status }
function statusType(status) { return statusMap[status]?.type || '' }

/** 加载订单 */
async function loadOrders() {
  loading.value = true
  try {
    const nickname = localStorage.getItem('user_nickname') || ''
    const phone = localStorage.getItem('user_phone') || ''
    const params = {}
    if (nickname) params.nickname = nickname
    if (phone) params.phone = phone
    if (activeTab.value) params.status = activeTab.value

    const res = await getOrders(params)
    if (res.code === 200) {
      orders.value = res.data.list
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => loadOrders())
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-list {
  padding: 12px;
}

.order-card {
  background: #fff;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #f5f5f5;
}

.order-no {
  font-size: 13px;
  color: #666;
  font-family: monospace;
}

.order-product {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f9f9f9;
}

.op-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.op-right {
  font-size: 12px;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}

.order-time {
  font-size: 12px;
  color: #bbb;
}

.order-amount {
  font-size: 14px;
  color: #333;
}

.order-amount strong {
  color: #ff6b6b;
  font-size: 16px;
}
</style>
