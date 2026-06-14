/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   操作日志接口（只读 + 清理 — /admin/v1/oper-logs）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 操作日志行 */
export interface OperLogItem {
  id: number
  tenant_id: number
  admin_id: number
  username: string
  method: string
  path: string
  perm: string
  ip: string
  user_agent: string
  request_body: string
  response_code: number
  http_status: number
  duration_ms: number
  request_id: string
  created_at: string | null
}

/** GET /admin/v1/oper-logs —— 分页列表（username/method/path/时间范围筛选） */
export function listOperLogs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<OperLogItem>>> {
  return request<PageResult<OperLogItem>>({ url: '/v1/oper-logs', method: 'get', params })
}

/** GET /admin/v1/oper-logs/:id —— 详情 */
export function getOperLog(id: number): Promise<ApiEnvelope<OperLogItem>> {
  return request<OperLogItem>({ url: `/v1/oper-logs/${id}`, method: 'get' })
}

/**
 * DELETE /admin/v1/oper-logs —— 批量清理（防误清：all=1 或 start_time+end_time 二选一）
 */
export function clearOperLogs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<{ deleted: number }>> {
  return request<{ deleted: number }>({ url: '/v1/oper-logs', method: 'delete', params })
}
