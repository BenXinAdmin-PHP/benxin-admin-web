/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   应用入口（挂载 Pinia / Router / i18n / 全局样式）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
// Element Plus 暗色主题变量：为后续主题切换（M1）预留，组件样式由按需自动导入处理
import 'element-plus/theme-chalk/dark/css-vars.css'
// 函数式调用的 ElMessage 为显式 import，单独引入其样式（非模板组件，按需导入不覆盖）
import 'element-plus/theme-chalk/el-message.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import { permission } from './directives/permission'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 按钮级权限指令 v-permission（perms 与后端 enforce 同源）
app.directive('permission', permission)

app.mount('#app')
