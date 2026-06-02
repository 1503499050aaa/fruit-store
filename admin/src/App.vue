<template>
  <!-- 商家后台根组件 -->
  <!-- 登录页：独立页面，不带侧边栏 -->
  <div v-if="$route.meta.noLayout">
    <router-view />
  </div>
  <!-- 其他页面：带侧边栏的管理后台布局 -->
  <div v-else class="admin-layout">
    <!-- 左侧边栏 -->
    <el-menu
      :default-active="currentPath"
      :collapse="isCollapse"
      class="sidebar"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#52c41a"
      router
    >
      <div class="logo-area">
        <span v-if="!isCollapse">🍍 一鸣鲜果</span>
        <span v-else>🍍</span>
      </div>

      <el-menu-item index="/dashboard">
        <el-icon><DataAnalysis /></el-icon>
        <span>数据大屏</span>
      </el-menu-item>

      <el-menu-item index="/orders">
        <el-icon><Tickets /></el-icon>
        <span>订单管理</span>
      </el-menu-item>

      <el-menu-item index="/products">
        <el-icon><Goods /></el-icon>
        <span>商品管理</span>
      </el-menu-item>

      <el-menu-item index="/customers">
        <el-icon><UserFilled /></el-icon>
        <span>客户管理</span>
      </el-menu-item>
    </el-menu>

    <!-- 右侧内容区域 -->
    <div class="main-area">
      <!-- 顶部导航条 -->
      <div class="topbar">
        <div class="topbar-left">
          <el-icon
            :size="22"
            style="cursor: pointer;"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" style="margin-left: 16px;">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ adminName }} <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * App.vue - 管理后台布局
 * 左侧深色侧边栏 + 右侧顶部导航 + 内容区
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DataAnalysis, Tickets, Goods, UserFilled, Fold, Expand, ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false) // 侧边栏是否折叠

const currentPath = computed(() => route.path)

// 从 localStorage 读取当前管理员名称
const adminName = computed(() => {
  try {
    const info = JSON.parse(localStorage.getItem('admin_info') || '{}')
    return info.display_name || '管理员'
  } catch {
    return '管理员'
  }
})

/** 下拉菜单操作 */
function handleCommand(command) {
  if (command === 'logout') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
    router.push('/login')
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  min-height: 100vh;
  border-right: none;
}

.sidebar:not(.el-menu--collapse) {
  width: 220px;
}

.el-menu--collapse {
  width: 64px;
}

.logo-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

/* 主区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* 顶部导航 */
.topbar {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 内容区 */
.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
  .sidebar .el-menu-item span {
    display: none;
  }
}
</style>
