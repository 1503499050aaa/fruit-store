<template>
  <!-- 个人中心页 -->
  <div class="mine-page">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-avatar">😊</div>
      <div class="user-name">{{ userNickname }}</div>
      <div class="user-phone" v-if="userPhone">{{ userPhone }}</div>
      <van-button size="mini" round plain type="default" @click="showEditDialog = true" style="margin-top: 8px;color:#fff;border-color:#fff;">
        修改信息
      </van-button>
    </div>

    <!-- 订单入口 -->
    <van-cell-group title="我的订单" style="margin-top: 10px;">
      <van-cell title="全部订单" is-link to="/orders" icon="orders-o" />
    </van-cell-group>

    <!-- 功能菜单 -->
    <van-cell-group title="服务" style="margin-top: 10px;">
      <van-cell title="联系店家" icon="service-o" is-link @click="contactShop" />
      <van-cell title="自提点地址" icon="location-o" is-link @click="showAddress" />
    </van-cell-group>

    <!-- 关于 -->
    <van-cell-group title="其他" style="margin-top: 10px;">
      <van-cell title="关于一鸣鲜果" icon="info-o" is-link @click="showAbout" />
      <van-cell title="当前版本" :value="'v1.0.0'" icon="star-o" />
    </van-cell-group>

    <!-- 编辑信息弹窗 -->
    <van-dialog
      v-model:show="showEditDialog"
      title="修改信息"
      show-cancel-button
      @confirm="saveUserInfo"
    >
      <div style="padding: 16px;">
        <van-field v-model="editForm.nickname" label="微信名" placeholder="请输入微信昵称" />
        <van-field v-model="editForm.phone" label="手机号" placeholder="请输入手机号（选填）" type="tel" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
/**
 * 个人中心页 - 用户信息、我的订单、联系店家
 */
import { ref, reactive } from 'vue'
import { showToast, showDialog } from 'vant'

const userNickname = ref(localStorage.getItem('user_nickname') || '果粉')
const userPhone = ref(localStorage.getItem('user_phone') || '')
const showEditDialog = ref(false)

const editForm = reactive({
  nickname: userNickname.value,
  phone: userPhone.value,
})

/** 保存用户信息 */
function saveUserInfo() {
  if (!editForm.nickname.trim()) {
    showToast('请输入微信名')
    return
  }
  localStorage.setItem('user_nickname', editForm.nickname.trim())
  localStorage.setItem('user_phone', editForm.phone)
  userNickname.value = editForm.nickname.trim()
  userPhone.value = editForm.phone
  showToast('已保存')
}

/** 联系店家 */
function contactShop() {
  showDialog({
    title: '联系店家',
    message: '微信号：yiming_fruit\n电话：1384741XXXX\n\n点击确定复制微信号',
    confirmButtonText: '复制微信号',
  }).then(() => {
    // 尝试复制到剪贴板
    navigator.clipboard?.writeText('yiming_fruit').then(() => {
      showToast('微信号已复制，请在微信中搜索添加')
    }).catch(() => {
      showToast('请手动搜索微信号：yiming_fruit')
    })
  }).catch(() => {})
}

/** 显示自提点 */
function showAddress() {
  showDialog({
    title: '📍 自提点地址',
    message: '1. 解放大街123号一鸣鲜果（总店）\n2. 工农路45号自提点\n\n营业时间：8:00-20:00',
    confirmButtonText: '知道了',
  })
}

/** 关于 */
function showAbout() {
  showDialog({
    title: '🍍 一鸣鲜果',
    message: '海南直发水果 · 空运直达\n今日海南 · 明日餐桌\n\n新鲜水果从海南果园直发，空运至内蒙古乌兰察布，保证新鲜度。\n\n版本：v1.0.0',
    confirmButtonText: '知道了',
  })
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.user-header {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  padding: 30px 20px 24px;
  text-align: center;
  color: #fff;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 10px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
}

.user-phone {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 2px;
}
</style>
