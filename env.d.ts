/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   全局类型声明（Vite 环境变量 / 虚拟模块）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
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
