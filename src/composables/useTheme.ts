/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   主题状态（5 套配色 + 明暗模式，localStorage 持久化，应用到 <html>）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 *
 * 与 src/styles/theme.css 配套：通过 <html data-theme data-mode> + .dark 类切换整组 CSS 变量。
 * 首屏防闪由 index.html 内联脚本先行设置 data 属性（见 index.html），本模块负责响应式与持久化。
 */
import { ref } from 'vue'

export type ThemeName = 'classic' | 'elegant' | 'tech' | 'gov' | 'bento'
export type ThemeMode = 'light' | 'dark'

/** 主题元信息（供主题面板渲染色块预览） */
export interface ThemeOption {
  name: ThemeName
  label: string
  /** 预览主色 */
  primary: string
  /** 预览侧栏色（呈现深浅气质） */
  sidebar: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { name: 'classic', label: '经典企业', primary: '#2b6fff', sidebar: '#0a1f44' },
  { name: 'elegant', label: '高级内敛', primary: '#c9a24b', sidebar: '#0c1a30' },
  { name: 'tech', label: '科技蓝', primary: '#2b6fff', sidebar: '#0c1830' },
  { name: 'gov', label: '政企蓝', primary: '#0a3a72', sidebar: '#ffffff' },
  { name: 'bento', label: 'Bento', primary: '#4f6ef7', sidebar: '#16140f' },
]

const THEME_NAMES: ThemeName[] = THEME_OPTIONS.map((o) => o.name)
const STORAGE_THEME = 'bx-theme'
const STORAGE_MODE = 'bx-mode'

const DEFAULT_THEME: ThemeName = 'classic'
const DEFAULT_MODE: ThemeMode = 'light'

function readTheme(): ThemeName {
  const v = localStorage.getItem(STORAGE_THEME) as ThemeName | null
  return v && THEME_NAMES.includes(v) ? v : DEFAULT_THEME
}

function readMode(): ThemeMode {
  const v = localStorage.getItem(STORAGE_MODE)
  return v === 'dark' ? 'dark' : DEFAULT_MODE
}

// 模块级单例状态：全站共享同一份主题（首次取自 localStorage，与防闪脚本一致）
const theme = ref<ThemeName>(readTheme())
const mode = ref<ThemeMode>(readMode())

/** 应用到 <html>：data-theme / data-mode + .dark 类（Element Plus 暗色 css-vars 依赖 .dark） */
function apply() {
  const el = document.documentElement
  el.dataset.theme = theme.value
  el.dataset.mode = mode.value
  el.classList.toggle('dark', mode.value === 'dark')
}

function setTheme(name: ThemeName) {
  theme.value = name
  localStorage.setItem(STORAGE_THEME, name)
  apply()
}

function setMode(m: ThemeMode) {
  mode.value = m
  localStorage.setItem(STORAGE_MODE, m)
  apply()
}

function toggleMode() {
  setMode(mode.value === 'dark' ? 'light' : 'dark')
}

/** 应用启动时调用一次，确保运行态与防闪脚本设置一致 */
export function initTheme() {
  apply()
}

export function useTheme() {
  return { theme, mode, setTheme, setMode, toggleMode, THEME_OPTIONS }
}
