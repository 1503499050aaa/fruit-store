<template>
  <!-- 下单结算页 -->
  <div class="checkout-page">
    <van-nav-bar title="确认下单" left-arrow @click-left="$router.back()" />

    <div v-if="cartItems.length === 0" style="text-align:center;padding:60px 0;">
      <van-empty description="购物车是空的" />
      <van-button type="primary" round color="#07c160" to="/cart">返回购物车</van-button>
    </div>

    <div v-else>
      <!-- 联系信息 -->
      <van-cell-group title="联系信息" style="margin-top: 10px;">
        <van-field v-model="form.nickname" label="微信名" placeholder="请输入您的微信昵称" required />
        <van-field v-model="form.phone" label="手机号" placeholder="请输入手机号（选填）" type="tel" />
      </van-cell-group>

      <!-- 自提点 -->
      <van-cell-group title="自提点" style="margin-top: 10px;">
        <van-field
          v-model="form.pickup_point"
          label="自提地址"
          readonly
          is-link
          @click="showPicker = true"
        />
      </van-cell-group>
      <van-popup v-model:show="showPicker" position="bottom" round>
        <van-picker
          :columns="pickupOptions"
          @confirm="onPickupConfirm"
          @cancel="showPicker = false"
          title="选择自提点"
        />
      </van-popup>

      <!-- 商品清单 -->
      <van-cell-group title="商品清单" style="margin-top: 10px;">
        <div v-for="item in cartItems" :key="item.product_id" class="order-item">
          <div class="order-item-left">
            <span class="order-item-name">{{ item.product_name }}</span>
            <span class="order-item-price">¥{{ item.price }}/斤</span>
          </div>
          <div class="order-item-right">
            <span class="order-item-qty">×{{ item.quantity }}</span>
            <span class="order-item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
      </van-cell-group>

      <!-- 备注 -->
      <van-cell-group style="margin-top: 10px;">
        <van-field v-model="form.remark" label="备注" placeholder="如有特殊要求请备注（选填）" />
      </van-cell-group>

      <!-- 金额汇总 -->
      <div class="amount-summary">
        <div class="amount-row">
          <span>商品金额</span>
          <span>¥{{ totalAmount }}</span>
        </div>
        <div class="amount-row total">
          <span>应付金额</span>
          <span class="total-price">¥{{ totalAmount }}</span>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div style="padding: 16px;">
        <van-button
          type="primary"
          size="large"
          round
          block
          color="#07c160"
          :loading="submitting"
          @click="submitOrder"
          :disabled="!form.nickname.trim()"
        >
          {{ submitting ? '提交中...' : `确认下单 ¥${totalAmount}` }}
        </van-button>
        <p style="text-align:center;color:#999;font-size:12px;margin-top:8px;">
          💡 当前为模拟支付，生成订单后联系店家付款
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 下单页 - 填写联系信息、选择自提点、提交订单
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { createOrder } from '../api'

const router = useRouter()
const submitting = ref(false)
const showPicker = ref(false)
const cartItems = ref([])

const form = reactive({
  nickname: localStorage.getItem('user_nickname') || '',
  phone: '',
  pickup_point: '乌兰察布集宁区解放大街123号一鸣鲜果',
  remark: '',
})

// 自提点选项
const pickupOptions = [
  { text: '解放大街123号一鸣鲜果（总店）', value: '乌兰察布集宁区解放大街123号一鸣鲜果' },
  { text: '工农路45号自提点', value: '乌兰察布集宁区工农路45号自提点' },
]

// 计算总金额
const totalAmount = computed(() => {
  return cartItems.value.reduce((s, item) => s + item.price * item.quantity, 0).toFixed(2)
})

/** 选择自提点 */
function onPickupConfirm({ selectedOptions }) {
  form.pickup_point = selectedOptions[0].value
  showPicker.value = false
}

/** 提交订单 */
async function submitOrder() {
  if (!form.nickname.trim()) {
    showToast('请输入微信名')
    return
  }

  submitting.value = true
  try {
    const res = await createOrder({
      nickname: form.nickname.trim(),
      phone: form.phone,
      pickup_point: form.pickup_point,
      remark: form.remark,
      items: cartItems.value.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    })

    if (res.code === 200) {
      // 保存用户信息
      localStorage.setItem('user_nickname', form.nickname)
      localStorage.setItem('user_phone', form.phone)
      // 清空购物车
      localStorage.setItem('cart_items', '[]')

      showSuccessToast('下单成功！')
      // 跳转到订单页
      setTimeout(() => {
        router.push('/orders')
      }, 1000)
    } else {
      showToast(res.message || '下单失败')
    }
  } catch (err) {
    showToast('网络错误，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  cartItems.value = JSON.parse(localStorage.getItem('cart_items') || '[]')
  if (cartItems.value.length === 0) {
    showToast('购物车为空，请先添加商品')
  }
})
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f5f5f5;
}

.order-item-left {
  display: flex;
  flex-direction: column;
}

.order-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.order-item-price {
  font-size: 12px;
  color: #ff6b6b;
}

.order-item-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-item-qty {
  font-size: 14px;
  color: #666;
}

.order-item-subtotal {
  font-size: 15px;
  font-weight: 600;
  color: #ff6b6b;
}

.amount-summary {
  background: #fff;
  padding: 16px;
  margin-top: 10px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  padding: 4px 0;
}

.amount-row.total {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  border-top: 1px solid #f5f5f5;
  padding-top: 10px;
  margin-top: 6px;
}

.total-price {
  color: #ff6b6b;
  font-size: 22px;
}
</style>
