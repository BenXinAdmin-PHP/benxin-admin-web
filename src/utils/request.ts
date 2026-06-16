/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   Axios 统一封装（业务码风格 A 拦截器 + 401 静默刷新）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-15（新增 silent 选项：调用方自处理业务码，抑制全局错误提示）
 * | @updated   2026-06-16（响应拦截器识别「非标准响应」为失败：2xx 但拿不到合法数字 code 的脏 JSON/HTML 污染/网关错误页统一 reject，不再透传为成功；二进制流按 responseType 前置放行）
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

/**
 * 后端统一分页结构（基线 §6.3）：page≥1、page_size 默认 15 上限 100。
 */
export interface PageResult<T = unknown> {
  list: T[]
  total: number
  page: number
  page_size: number
}

/** 扩展请求配置：silent=true 时拦截器不弹全局错误提示，业务码交调用方处理 */
export type RequestConfig = AxiosRequestConfig & { silent?: boolean }

/** 业务错误（携带后端 code，便于调用方按码分支，如 VOD 未开通 422101 回退本地） */
export type BizError = Error & { code?: number }

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

// 响应拦截：按「二进制流 → JSON 信封 → 非标准响应」顺序判定（前置条件先判，避免误伤）
service.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const config = response.config as RequestConfig

    // ① 二进制流（blob/arraybuffer）：在 JSON 信封判断之前按 responseType 放行。
    //    返回完整 AxiosResponse，消费方读 resp.data（如 resolvePreviewUrl 取 Blob 预览）；
    //    其失败由 HTTP 状态分支（error handler）兜底，不套 {code} 判断。
    const responseType = config.responseType
    if (responseType === 'blob' || responseType === 'arraybuffer') {
      return response
    }

    // ② HTTP 状态非 2xx 不会进入此成功分支（axios 默认 validateStatus = 2xx），
    //    含 413/502 等返回 HTML 的情况统一由下方 error handler reject。

    // ③ 期望 JSON 信封：
    const envelope = response.data
    // a. 合法对象且含数字型 code —— 走既有成功 / 业务错误语义（不改变）
    if (envelope != null && typeof envelope === 'object' && typeof envelope.code === 'number') {
      if (envelope.code === 0) {
        return envelope as unknown as AxiosResponse
      }
      // silent：调用方自行处理业务码（如 VOD 未开通 422101 静默回退本地），不弹全局提示
      if (!config.silent) {
        ElMessage.error(envelope.msg || `请求失败（code=${envelope.code}）`)
      }
      const bizErr = new Error(envelope.msg || `business error: ${envelope.code}`) as BizError
      bizErr.code = envelope.code
      return Promise.reject(bizErr)
    }

    // b. ★核心修复：2xx 但拿不到合法数字型 code（脏 JSON / HTML 污染 / 空体 / 网关错误页）
    //    → 识别为「非标准响应」，统一 reject，绝不把脏内容当 data 透传为成功。
    //    silent 只抑制全局提示 UI，不改变失败判定——非标准响应即便 silent 也是失败（交调用方）。
    if (!config.silent) {
      ElMessage.error('服务端返回异常响应（可能被错误信息污染或网关异常）')
    }
    return Promise.reject(
      new Error('非标准响应：服务端返回内容无法解析为业务信封（可能被 PHP 警告/错误信息污染或网关错误页）'),
    )
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
    if (!(error?.config as RequestConfig | undefined)?.silent) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

/**
 * 业务请求统一入口：成功时直接拿到信封（code===0），失败已在拦截器抛出。
 */
export function request<T = unknown>(config: RequestConfig): Promise<ApiEnvelope<T>> {
  return service(config) as unknown as Promise<ApiEnvelope<T>>
}

export default service
