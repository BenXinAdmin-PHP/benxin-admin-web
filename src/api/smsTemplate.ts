/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   短信模板接口（CRUD + 状态 — /admin/v1/sms-templates）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-13
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 短信模板行（列表/详情共用） */
export interface SmsTemplateItem {
  id: number
  tenant_id: number
  scene: string
  channel: string
  template_code: string
  sign_name: string
  content: string
  /** 状态：1正常 0停用 */
  status: number
  remark: string
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/sms-templates —— 分页列表（keyword 模糊 scene，channel 精确，status 精确） */
export function listSmsTemplates(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<SmsTemplateItem>>> {
  return request<PageResult<SmsTemplateItem>>({ url: '/v1/sms-templates', method: 'get', params })
}

/** GET /admin/v1/sms-templates/:id —— 详情 */
export function getSmsTemplate(id: number): Promise<ApiEnvelope<SmsTemplateItem>> {
  return request<SmsTemplateItem>({ url: `/v1/sms-templates/${id}`, method: 'get' })
}

/** POST /admin/v1/sms-templates —— 新增（sceneCreate：scene/channel/template_code 必填） */
export function createSmsTemplate(
  data: Record<string, unknown>,
): Promise<ApiEnvelope<SmsTemplateItem>> {
  return request<SmsTemplateItem>({ url: '/v1/sms-templates', method: 'post', data })
}

/** PUT /admin/v1/sms-templates/:id —— 更新（选择性字段） */
export function updateSmsTemplate(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<SmsTemplateItem>> {
  return request<SmsTemplateItem>({ url: `/v1/sms-templates/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/sms-templates/:id —— 删除 */
export function deleteSmsTemplate(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/sms-templates/${id}`, method: 'delete' })
}

/** PUT /admin/v1/sms-templates/:id/status —— 启停 */
export function setSmsTemplateStatus(
  id: number,
  status: number,
): Promise<ApiEnvelope<SmsTemplateItem>> {
  return request<SmsTemplateItem>({ url: `/v1/sms-templates/${id}/status`, method: 'put', data: { status } })
}
