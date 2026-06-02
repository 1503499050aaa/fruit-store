import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置 - Vue3 项目的打包工具
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // 开发服务器端口
    // 把 /api 开头的请求代理到后端 3456 端口（开发时避免跨域问题）
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
  // 静态资源的基础路径（部署在 /admin 子路径下）
  base: '/admin/',
  // 打包输出目录
  build: {
    outDir: 'dist',
  },
})
