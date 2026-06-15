/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   短信日志接口（只读 — /admin/v1/sms-logs）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 短信日志行 */
export interface SmsLogItem {
  id: number
  tenant_id: number
  mobile: string
  channel: string
  scene: string
  template_code: string
  params: string
  /** 1 成功 / 0 失败 */
  status: number
  response: string
  ip: string
  request_id: string
  created_at: string | null
}

/** GET /admin/v1/sms-logs —— 分页列表（mobile/scene/channel/status/时间范围筛选） */
export function listSmsLogs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<SmsLogItem>>> {
  return request<PageResult<SmsLogItem>>({ url: '/v1/sms-logs', method: 'get', params })
}

/** GET /admin/v1/sms-logs/:id —— 详情 */
export function getSmsLog(id: number): Promise<ApiEnvelope<SmsLogItem>> {
  return request<SmsLogItem>({ url: `/v1/sms-logs/${id}`, method: 'get' })
}
