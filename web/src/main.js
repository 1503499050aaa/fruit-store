/**
 * 手机H5商城 - Vue3 应用入口
 */
import { createApp } from 'vue'
import 'vant/lib/index.css' // Vant 全局样式
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
