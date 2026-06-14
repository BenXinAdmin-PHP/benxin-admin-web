/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   登录日志接口（只读 + 清理 — /admin/v1/login-logs）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 登录日志行 */
export interface LoginLogItem {
  id: number
  tenant_id: number
  username: string
  admin_id: number
  ip: string
  user_agent: string
  /** 1 成功 / 0 失败 */
  status: number
  msg: string
  request_id: string
  created_at: string | null
}

/** GET /admin/v1/login-logs —— 分页列表（username/status/时间范围筛选） */
export function listLoginLogs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<LoginLogItem>>> {
  return request<PageResult<LoginLogItem>>({ url: '/v1/login-logs', method: 'get', params })
}

/** GET /admin/v1/login-logs/:id —— 详情 */
export function getLoginLog(id: number): Promise<ApiEnvelope<LoginLogItem>> {
  return request<LoginLogItem>({ url: `/v1/login-logs/${id}`, method: 'get' })
}

/** DELETE /admin/v1/login-logs —— 批量清理（防误清：all=1 或 start_time+end_time） */
export function clearLoginLogs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<{ deleted: number }>> {
  return request<{ deleted: number }>({ url: '/v1/login-logs', method: 'delete', params })
}
