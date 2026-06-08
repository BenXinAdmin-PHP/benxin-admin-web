/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   用户会话 Store（token 占位，鉴权逻辑留待 M1）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

// M0 仅占位：保存 access / refresh token 供 axios 请求拦截器读取。
// 真正的登录、token 持久化与刷新逻辑在 M1 实现。
export const useUserStore = defineStore('user', () => {
  const accessToken = ref('')
  const refreshToken = ref('')

  function setTokens(access: string, refresh = '') {
    accessToken.value = access
    refreshToken.value = refresh
  }

  function clearTokens() {
    accessToken.value = ''
    refreshToken.value = ''
  }

  return { accessToken, refreshToken, setTokens, clearTokens }
})
