<template>
  <!-- 客户管理页 -->
  <div class="customers-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>客户管理</span>
          <el-button type="success" @click="handleExport">导出Excel</el-button>
        </div>
      </template>

      <!-- 搜索 -->
      <el-form :inline="true" size="default" style="margin-bottom: 16px;">
        <el-form-item>
          <el-input v-model="keyword" placeholder="搜索微信名或手机号..." clearable @keyup.enter="loadUsers" style="width: 260px;">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 客户表格 -->
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="nickname" label="微信名/昵称" width="160" />
        <el-table-column prop="phone" label="手机号" width="140">
          <template #default="scope">{{ scope.row.phone || '未填写' }}</template>
        </el-table-column>
        <el-table-column prop="order_count" label="下单次数" width="100" sortable />
        <el-table-column prop="total_spent" label="累计消费" width="120" sortable>
          <template #default="scope">¥{{ scope.row.total_spent || 0 }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="首次下单" width="160" />
        <el-table-column label="客户价值" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.total_spent >= 500" type="danger" size="small">VIP</el-tag>
            <el-tag v-else-if="scope.row.total_spent >= 200" type="warning" size="small">老客户</el-tag>
            <el-tag v-else-if="scope.row.order_count >= 3" type="success" size="small">回头客</el-tag>
            <el-tag v-else type="info" size="small">新客户</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadUsers"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * 客户管理页 - 查看下单用户、消费统计、导出CSV
 */
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getUsers, exportUsers } from '../api'

const users = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')

/** 加载客户列表 */
async function loadUsers() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (keyword.value) params.keyword = keyword.value
    const res = await getUsers(params)
    if (res.code === 200) {
      users.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

/** 导出客户数据为CSV文件（Excel可以直接打开） */
async function handleExport() {
  try {
    const res = await exportUsers()
    // 创建 Blob 并触发下载
    const blob = new Blob([res.data || res], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `客户数据_${new Date().toISOString().substring(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功！文件已下载')
  } catch (err) {
    ElMessage.error('导出失败，请重试')
  }
}

onMounted(() => loadUsers())
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
