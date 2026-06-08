/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   系统类接口（手写示例，OpenAPI 自动生成留待 M1）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** ping 接口返回的 data 结构（按后端实际为准，M0 仅作联调示例） */
export interface PingData {
  [key: string]: unknown
}

/**
 * GET /admin/v1/ping —— 后端联调健康检查
 * baseURL 已含 /admin 前缀，故此处只写 /v1/ping。
 */
export function getPing(): Promise<ApiEnvelope<PingData>> {
  return request<PingData>({
    url: '/v1/ping',
    method: 'get',
  })
}
