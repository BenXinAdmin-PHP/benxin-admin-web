/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   Axios 统一封装（业务码风格 A 拦截器）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
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

const service = axios.create({
  // baseURL 读环境变量（.env.development 指向后端 /admin 前缀）
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
})

// 请求拦截：注入 token（占位，M0 store 内为空）
service.interceptors.request.use(
  (config) => {
    // TODO M1: 登录后 token 落 store / 本地持久化，这里按需注入并处理过期
    const userStore = useUserStore()
    if (userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截：先判 HTTP，再判业务码 code
service.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const envelope = response.data
    // 非标准信封（如后端直返非 JSON）直接放行交由调用方处理
    if (envelope == null || typeof envelope.code === 'undefined') {
      return response
    }
    if (envelope.code === 0) {
      // 成功：把整个信封交给调用方（便于展示 request_id 等）
      return envelope as unknown as AxiosResponse
    }
    // 业务失败：统一提示并抛错
    ElMessage.error(envelope.msg || `请求失败（code=${envelope.code}）`)
    return Promise.reject(new Error(envelope.msg || `business error: ${envelope.code}`))
  },
  (error) => {
    // HTTP 层错误
    const status = error?.response?.status
    if (status === 401) {
      // TODO M1: 鉴权失效 —— 触发登出 / refresh token 续期钩子，随后跳登录页
      ElMessage.error('登录状态已失效，请重新登录')
    } else {
      const msg = error?.response?.data?.msg || error?.message || '网络异常，请稍后重试'
      ElMessage.error(msg)
    }
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
