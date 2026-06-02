<template>
  <!-- 订单管理页 -->
  <div class="orders-page">
    <!-- 搜索筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filter" size="default">
        <el-form-item label="订单状态">
          <el-select v-model="filter.status" placeholder="全部" clearable style="width: 140px;">
            <el-option label="待付款" value="pending" />
            <el-option label="待发货" value="paid" />
            <el-option label="待自提" value="ready" />
            <el-option label="已完成" value="done" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrders">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card shadow="never" style="margin-top: 16px;">
      <template #header>
        <span>订单列表</span>
        <span style="color: #999; font-size: 13px; margin-left: 8px;">共 {{ total }} 条</span>
      </template>
      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单编号" width="170" />
        <el-table-column prop="nickname" label="客户" width="120" />
        <el-table-column label="商品" min-width="200">
          <template #default="scope">
            <el-tag v-for="item in scope.row.items" :key="item.id" size="small" style="margin: 2px 4px 2px 0;">
              {{ item.product_name }} ×{{ item.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="100" sortable>
          <template #default="scope">¥{{ scope.row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pickup_point" label="自提点" width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="下单时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'pending'" type="success" size="small" @click="changeStatus(scope.row, 'paid')">确认备货</el-button>
            <el-button v-if="scope.row.status === 'paid'" type="warning" size="small" @click="changeStatus(scope.row, 'ready')">到货通知</el-button>
            <el-button v-if="scope.row.status === 'ready'" type="primary" size="small" @click="changeStatus(scope.row, 'done')">已自提</el-button>
            <el-button v-if="['pending','paid'].includes(scope.row.status)" type="danger" size="small" plain @click="changeStatus(scope.row, 'cancelled')">取消</el-button>
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
          @change="loadOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
/**
 * 订单管理页 - 查看、筛选、修改订单状态
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, updateOrderStatus } from '../api'

const orders = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filter = reactive({
  status: '',
  dateRange: [],
})

// 订单状态映射
const statusMap = {
  pending: { text: '待付款', type: 'warning' },
  paid: { text: '待发货', type: 'info' },
  ready: { text: '待自提', type: '' },
  done: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'danger' },
}

function statusText(status) { return statusMap[status]?.text || status }
function statusType(status) { return statusMap[status]?.type || '' }

/** 加载订单列表 */
async function loadOrders() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filter.status) params.status = filter.status
    if (filter.dateRange && filter.dateRange.length === 2) {
      params.start_date = filter.dateRange[0]
      params.end_date = filter.dateRange[1]
    }
    const res = await getOrders(params)
    if (res.code === 200) {
      orders.value = res.data.list
      total.value = res.data.total
    }
  } catch (err) {
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

/** 修改订单状态 */
async function changeStatus(order, newStatus) {
  const text = newStatus === 'cancelled' ? '确定要取消这个订单吗？取消后会恢复库存。' : `确定将订单状态改为"${statusText(newStatus)}"吗？`
  try {
    await ElMessageBox.confirm(text, '操作确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
  } catch { return }

  const res = await updateOrderStatus(order.id, newStatus)
  if (res.code === 200) {
    ElMessage.success(res.message)
    loadOrders() // 刷新列表
  } else {
    ElMessage.error(res.message)
  }
}

/** 重置筛选 */
function resetFilter() {
  filter.status = ''
  filter.dateRange = []
  page.value = 1
  loadOrders()
}

onMounted(() => loadOrders())
</script>

<style scoped>
.filter-card :deep(.el-card__body) {
  padding-bottom: 0;
}
</style>
