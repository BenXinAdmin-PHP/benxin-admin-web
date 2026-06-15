/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   i18n 初始化（初期仅简体中文，框架预留多语言）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import { createI18n } from 'vue-i18n'
import zhCn from './lang/zh-cn'

// 初期只配 zh-cn；后续新增语言在 lang/ 下补文件并在此注册即可（多语言切换 UI 留待 M1+）
export const DEFAULT_LOCALE = 'zh-cn'

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-cn': zhCn,
  },
})

export default i18n
