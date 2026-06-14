/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   参数配置接口（CRUD + 按分组取数 — /admin/v1/configs）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 * 敏感项（is_sensitive=1）后端回显脱敏为 ****；更新时若提交 **** 则后端保留原值。
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 参数配置行 */
export interface ConfigItem {
  id: number
  tenant_id: number
  name: string
  group: string
  key: string
  value: string
  remark: string
  is_sensitive: number
  value_type: string
  sort: number
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/configs —— 分页列表（group/keyword 筛选；敏感脱敏） */
export function listConfigs(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<ConfigItem>>> {
  return request<PageResult<ConfigItem>>({ url: '/v1/configs', method: 'get', params })
}

/** GET /admin/v1/configs/:id —— 详情（敏感脱敏） */
export function getConfig(id: number): Promise<ApiEnvelope<ConfigItem>> {
  return request<ConfigItem>({ url: `/v1/configs/${id}`, method: 'get' })
}

/** GET /admin/v1/configs/group/:group —— 按分组取全部配置（敏感脱敏） */
export function getConfigsByGroup(group: string): Promise<ApiEnvelope<ConfigItem[]>> {
  return request<ConfigItem[]>({ url: `/v1/configs/group/${group}`, method: 'get' })
}

/** POST /admin/v1/configs —— 新增 */
export function createConfig(data: Record<string, unknown>): Promise<ApiEnvelope<ConfigItem>> {
  return request<ConfigItem>({ url: '/v1/configs', method: 'post', data })
}

/** PUT /admin/v1/configs/:id —— 更新（敏感项提交 **** 占位则保留原值） */
export function updateConfig(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ConfigItem>> {
  return request<ConfigItem>({ url: `/v1/configs/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/configs/:id —— 删除 */
export function deleteConfig(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/configs/${id}`, method: 'delete' })
}
