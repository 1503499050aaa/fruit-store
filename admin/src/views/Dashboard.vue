<template>
  <!-- 数据大屏 - 商家后台首页看板 -->
  <div class="dashboard">
    <!-- 统计卡片行 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff;">
            <el-icon :size="28" color="#1890ff"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日订单</div>
            <div class="stat-value">{{ dashboardData.today.order_count }}<span class="stat-unit">单</span></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #fff7e6;">
            <el-icon :size="28" color="#fa8c16"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日销售额</div>
            <div class="stat-value">¥{{ dashboardData.today.total_sales }}<span class="stat-unit"></span></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f6ffed;">
            <el-icon :size="28" color="#52c41a"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日下单人数</div>
            <div class="stat-value">{{ dashboardData.today.user_count }}<span class="stat-unit">人</span></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card warning-card">
          <div class="stat-icon" style="background: #fff1f0;">
            <el-icon :size="28" color="#f5222d"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">待处理订单</div>
            <div class="stat-value" style="color: #f5222d;">{{ dashboardData.today.pending_count }}<span class="stat-unit">单</span></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表行 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 柱状图：近7天各品类销量对比 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>📊 近7天各品类销量对比</span></template>
          <div ref="categoryChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <!-- 饼图：本周热销水果TOP5 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header><span>🍉 本周热销水果 TOP5</span></template>
          <div ref="pieChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 折线图 + 库存预警 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 折线图：近30天销售趋势 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover">
          <template #header><span>📈 近30天销售趋势</span></template>
          <div ref="trendChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <!-- 库存预警 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover">
          <template #header>
            <span>⚠️ 库存预警</span>
            <el-tag v-if="dashboardData.low_stock.length > 0" type="danger" size="small" style="margin-left: 12px;">
              {{ dashboardData.low_stock.length }} 个预警
            </el-tag>
          </template>
          <div v-if="dashboardData.low_stock.length === 0" class="empty-tip">🎉 库存充足，暂无预警</div>
          <el-table v-else :data="dashboardData.low_stock" size="small" :show-header="true">
            <el-table-column prop="name" label="水果名称" />
            <el-table-column prop="stock" label="库存" width="70">
              <template #default="scope">
                <el-tag :type="scope.row.stock === 0 ? 'danger' : 'warning'" size="small">
                  {{ scope.row.stock }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="单价" width="80">
              <template #default="scope">¥{{ scope.row.price }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/**
 * 数据大屏 - 用 ECharts 展示销售数据
 * 包含：统计卡片、柱状图、饼图、折线图、库存预警
 */
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Document, Money, User, Clock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getDashboardOverview } from '../api'

// 图表 DOM 引用
const categoryChartRef = ref(null)
const pieChartRef = ref(null)
const trendChartRef = ref(null)

// 图表实例
let categoryChart = null
let pieChart = null
let trendChart = null

// 大屏数据
const dashboardData = reactive({
  today: { order_count: 0, total_sales: 0, user_count: 0, pending_count: 0 },
  low_stock: [],
  category_sales: [],
  top_products: [],
  sales_trend: [],
})

/** 加载数据 */
async function loadData() {
  try {
    const res = await getDashboardOverview()
    if (res.code === 200) {
      Object.assign(dashboardData, res.data)
      // 数据回来后渲染图表
      await nextTick()
      renderCharts()
    }
  } catch (err) {
    console.error('加载大屏数据失败:', err)
  }
}

/** 渲染所有图表 */
function renderCharts() {
  renderCategoryChart()
  renderPieChart()
  renderTrendChart()
}

/** 柱状图 - 各品类销量对比 */
function renderCategoryChart() {
  if (!categoryChartRef.value) return
  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value)
  }
  const data = dashboardData.category_sales
  categoryChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.category_name || '未分类'),
      axisLabel: { fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      name: '销量（斤）',
      nameTextStyle: { fontSize: 12 },
    },
    series: [{
      name: '销量',
      type: 'bar',
      data: data.map(d => d.total_quantity),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#188df0' },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
      barWidth: '50%',
    }],
  })
}

/** 饼图 - 热销水果TOP5 */
function renderPieChart() {
  if (!pieChartRef.value) return
  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }
  const data = dashboardData.top_products
  const colors = ['#52c41a', '#1890ff', '#fa8c16', '#f5222d', '#722ed1']
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}斤 ({d}%)' },
    legend: { bottom: '0%', textStyle: { fontSize: 11 } },
    series: [{
      name: '热销TOP5',
      type: 'pie',
      radius: ['45%', '70%'], // 圆环图
      center: ['50%', '45%'],
      data: data.map((d, i) => ({
        value: d.total_quantity,
        name: d.product_name,
        itemStyle: { color: colors[i % colors.length] },
      })),
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
      },
      label: {
        formatter: '{b}\n{d}%',
        fontSize: 11,
      },
    }],
  })
}

/** 折线图 - 30天销售趋势 */
function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const data = dashboardData.sales_trend
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '订单数'], bottom: '0%' },
    grid: { left: '3%', right: '5%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.substring(5)), // 只显示月-日
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额(元)',
        nameTextStyle: { fontSize: 12 },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: { fontSize: 12 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: data.map(d => d.total_sales),
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
          ]),
        },
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map(d => d.order_count),
        itemStyle: { color: '#1890ff' },
      },
    ],
  })
}

// 监听窗口大小变化，自动调整图表尺寸
function handleResize() {
  categoryChart?.resize()
  pieChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  categoryChart?.dispose()
  pieChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #999;
  margin-left: 4px;
}

.chart-row {
  margin-bottom: 20px;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #52c41a;
  font-size: 16px;
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 22px;
  }
}
</style>
