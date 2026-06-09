/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   Axios 统一封装（业务码风格 A 拦截器 + 401 静默刷新）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-09
 * +----------------------------------------------------------------------
 */
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

/**
 * 后端统一返回信封（业务码风格 A）
 * code===0 表示成功；非 0 为业务错误。
 */
export interface ApiEnvelope<T = unknown> {
  code: number
  msg: string
  data: T
  request_id: string
  timestamp: number
}

// 认证错误码（与后端 ErrorCode 对齐）
const CODE_UNAUTHORIZED = 401001 // 无效/缺失 token
const CODE_TOKEN_EXPIRED = 401003 // access 过期 → 可静默刷新
const CODE_REFRESH_INVALID = 401004 // refresh 失效 → 跳登录

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
})

// 请求拦截：注入 access token
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---- 单飞刷新：并发请求遇 401003 时只发一次 /refresh，其余排队 ----
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token))
  pendingQueue = []
}

/** 跳登录页（清会话后） */
function redirectToLogin() {
  const userStore = useUserStore()
  userStore.clearSession()
  const redirect = encodeURIComponent(window.location.hash.replace(/^#/, '') || '/')
  if (!window.location.hash.startsWith('#/login')) {
    window.location.hash = `#/login?redirect=${redirect}`
  }
}

/** 用 refresh 换新 access（裸 axios，避开拦截器递归） */
async function doRefresh(): Promise<string | null> {
  const userStore = useUserStore()
  if (!userStore.refreshToken) return null
  try {
    const resp = await axios.post(`${import.meta.env.VITE_API_BASE}/v1/refresh`, {
      refresh_token: userStore.refreshToken,
    })
    const envelope = resp.data as ApiEnvelope<{ access_token: string }>
    if (envelope.code === 0 && envelope.data?.access_token) {
      userStore.setAccessToken(envelope.data.access_token)
      return envelope.data.access_token
    }
    return null
  } catch {
    return null
  }
}

// 响应拦截：先判 HTTP，再判业务码 code
service.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const envelope = response.data
    if (envelope == null || typeof envelope.code === 'undefined') {
      return response
    }
    if (envelope.code === 0) {
      return envelope as unknown as AxiosResponse
    }
    ElMessage.error(envelope.msg || `请求失败（code=${envelope.code}）`)
    return Promise.reject(new Error(envelope.msg || `business error: ${envelope.code}`))
  },
  async (error) => {
    const status = error?.response?.status
    const bizCode = error?.response?.data?.code as number | undefined
    const original = error?.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (status === 401 && original) {
      // access 过期 → 静默刷新并重试原请求（每个请求只重试一次）
      if (bizCode === CODE_TOKEN_EXPIRED && !original._retried) {
        original._retried = true

        if (isRefreshing) {
          // 刷新进行中 → 排队，刷新完成后用新 token 重试
          return new Promise((resolve, reject) => {
            pendingQueue.push((token) => {
              if (token) {
                original.headers.Authorization = `Bearer ${token}`
                resolve(service(original))
              } else {
                reject(error)
              }
            })
          })
        }

        isRefreshing = true
        const newToken = await doRefresh()
        isRefreshing = false
        flushQueue(newToken)

        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`
          return service(original)
        }
        // 刷新失败 → 跳登录
        redirectToLogin()
        return Promise.reject(error)
      }

      // 无效 token / refresh 失效 → 跳登录
      if (bizCode === CODE_UNAUTHORIZED || bizCode === CODE_REFRESH_INVALID || original._retried) {
        ElMessage.error(error?.response?.data?.msg || '登录状态已失效，请重新登录')
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    const msg = error?.response?.data?.msg || error?.message || '网络异常，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

/**
 * 业务请求统一入口：成功时直接拿到信封（code===0），失败已在拦截器抛出。
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  return service(config) as unknown as Promise<ApiEnvelope<T>>
}

export default service
