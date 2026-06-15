/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   应用入口（挂载 Pinia / Router / i18n / 全局样式）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-10
 * +----------------------------------------------------------------------
 */
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
// Element Plus 暗色主题变量：暗色模式由 <html>.dark 激活（见 useTheme），须在 theme.css 之前引入，
// 让 theme.css 的 html.dark 覆盖在其后生效（同特异性后者胜出）。
import 'element-plus/theme-chalk/dark/css-vars.css'
// 函数式调用的 ElMessage / ElMessageBox 为显式 import，单独引入其样式（非模板组件，按需导入不覆盖）
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'
// Design Token 体系（5 套主题 × 明暗）+ 全局精致化样式
import '@/styles/theme.css'
import '@/styles/app.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import { permission } from './directives/permission'
import { initTheme } from '@/composables/useTheme'

// 应用主题（与 index.html 首屏防闪脚本设置一致，确保运行态同步）
initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 按钮级权限指令 v-permission（perms 与后端 enforce 同源）
app.directive('permission', permission)

app.mount('#app')
