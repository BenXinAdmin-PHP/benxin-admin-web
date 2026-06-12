/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   全局类型声明（Vite 环境变量 / 虚拟模块）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-12（M4-A：@wangeditor/editor-for-vue 类型 shim）
 * +----------------------------------------------------------------------
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 admin 前缀基础地址，如 http://127.0.0.1:8000/admin */
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// UnoCSS 注入的虚拟样式模块
declare module 'virtual:uno.css'

// @wangeditor/editor-for-vue@5.1.x 的 package.json exports 未映射 types，
// TS 按 exports 解析不到 dist/src/index.d.ts（上游问题），本地 shim 兜底
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'

  export const Editor: DefineComponent<{
    modelValue?: string
    defaultConfig?: Record<string, unknown>
    defaultContent?: unknown[]
    defaultHtml?: string
    mode?: string
  }>
  export const Toolbar: DefineComponent<{
    editor?: unknown
    defaultConfig?: Record<string, unknown>
    mode?: string
  }>
}
