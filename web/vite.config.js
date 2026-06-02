import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// Vite 配置 - 手机H5商城
export default defineConfig({
  plugins: [
    vue(),
    // 自动按需引入 Vant 组件，不用手动 import
    Components({ resolvers: [VantResolver()] }),
  ],
  server: {
    port: 5174, // 开发服务器端口（和后台不冲突）
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
  // 静态资源的基础路径（部署在 /web 子路径下）
  base: '/web/',
  build: {
    outDir: 'dist',
  },
})
