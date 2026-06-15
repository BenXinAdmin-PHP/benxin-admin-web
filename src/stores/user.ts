/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   用户会话 Store（令牌持久化 + profile/roles/perms）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-09
 * +----------------------------------------------------------------------
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getProfile,
  login as loginApi,
  logout as logoutApi,
  type MenuNode,
  type ProfileData,
} from '@/api/auth'

// 令牌持久化用 localStorage（起步方案；注意 XSS 风险——脚本可读取。
// 后续可选迁移到 httpOnly cookie + CSRF，列为后续优化，不在 M1）。
const ACCESS_KEY = 'bx_access_token'
const REFRESH_KEY = 'bx_refresh_token'

export const useUserStore = defineStore('user', () => {
  const accessToken = ref(localStorage.getItem(ACCESS_KEY) || '')
  const refreshToken = ref(localStorage.getItem(REFRESH_KEY) || '')

  const user = ref<ProfileData['user'] | null>(null)
  const roles = ref<string[]>([])
  const perms = ref<string[]>([])
  const menus = ref<MenuNode[]>([])
  // 动态路由是否已注册（刷新页面后用于重建）
  const routesReady = ref(false)

  function setTokens(access: string, refresh?: string) {
    accessToken.value = access
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh !== undefined) {
      refreshToken.value = refresh
      localStorage.setItem(REFRESH_KEY, refresh)
    }
  }

  /** 仅更新 access（refresh 续期场景） */
  function setAccessToken(access: string) {
    accessToken.value = access
    localStorage.setItem(ACCESS_KEY, access)
  }

  function clearSession() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    roles.value = []
    perms.value = []
    menus.value = []
    routesReady.value = false
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  /** 账号密码登录 */
  async function login(username: string, password: string) {
    const { data } = await loginApi(username, password)
    setTokens(data.access_token, data.refresh_token)
  }

  /** 拉取并存储个人信息（user/roles/perms/menus） */
  async function fetchProfile(): Promise<ProfileData> {
    const { data } = await getProfile()
    user.value = data.user
    roles.value = data.roles
    perms.value = data.perms
    menus.value = data.menus
    return data
  }

  /** 退出登录（调后端登出后清本地） */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 后端登出失败（如 token 已失效）忽略，仍清本地
    }
    clearSession()
  }

  /** 按钮级权限判断（与后端 enforce 同源；超管 * 兜底） */
  function hasPerm(perm: string): boolean {
    if (!perm) return true
    return perms.value.includes(perm) || perms.value.includes('*')
  }

  return {
    accessToken,
    refreshToken,
    user,
    roles,
    perms,
    menus,
    routesReady,
    setTokens,
    setAccessToken,
    clearSession,
    login,
    fetchProfile,
    logout,
    hasPerm,
  }
})
