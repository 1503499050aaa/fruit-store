<template>
  <!-- 商家后台登录页 -->
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🍍 一鸣鲜果</h1>
        <p>海南直发 · 新鲜直达</p>
        <p class="sub">商家管理后台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :loading="loading" @click="handleLogin" style="width: 100%">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-tip">演示账号：admin / 123456</p>
      <p class="login-tip">合伙人：partner / 123456</p>
    </div>
  </div>
</template>

<script setup>
/**
 * 登录页 - 管理员输入账号密码登录
 */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { adminLogin } from '../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

// 表单校验规则
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

/** 处理登录 */
async function handleLogin() {
  // 先校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await adminLogin(form.username, form.password)
    if (res.code === 200) {
      // 登录成功，保存 token 和管理员信息到 localStorage
      localStorage.setItem('admin_token', res.data.token)
      localStorage.setItem('admin_info', JSON.stringify(res.data.admin))
      ElMessage.success(`欢迎回来，${res.data.admin.display_name}！`)
      router.push('/dashboard')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    ElMessage.error('网络错误，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-header .sub {
  color: #67c23a;
  margin-top: 4px;
  font-weight: 500;
}

.login-tip {
  text-align: center;
  color: #bbb;
  font-size: 12px;
  margin-top: 4px;
}
</style>
