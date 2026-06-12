/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   内容分类接口（树 + CRUD + 状态 — /admin/v1/content-categories）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-12
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** 内容分类树节点（管理端全字段；children 仅在有子节点时存在） */
export interface ContentCategoryItem {
  id: number
  tenant_id: number
  parent_id: number
  name: string
  sort: number
  status: number
  icon: string
  created_at: string | null
  updated_at: string | null
  children?: ContentCategoryItem[]
}

/** GET /admin/v1/content-categories/tree —— 完整内容分类树（无分页） */
export function getContentCategoryTree(): Promise<ApiEnvelope<ContentCategoryItem[]>> {
  return request<ContentCategoryItem[]>({ url: '/v1/content-categories/tree', method: 'get' })
}

/** GET /admin/v1/content-categories/:id —— 详情 */
export function getContentCategory(id: number): Promise<ApiEnvelope<ContentCategoryItem>> {
  return request<ContentCategoryItem>({ url: `/v1/content-categories/${id}`, method: 'get' })
}

/** POST /admin/v1/content-categories —— 新增（sceneCreate：name 必填） */
export function createContentCategory(
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ContentCategoryItem>> {
  return request<ContentCategoryItem>({ url: '/v1/content-categories', method: 'post', data })
}

/** PUT /admin/v1/content-categories/:id —— 更新（选择性字段；防自指/成环在后端） */
export function updateContentCategory(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ContentCategoryItem>> {
  return request<ContentCategoryItem>({ url: `/v1/content-categories/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/content-categories/:id —— 删除（有子节点 → 422） */
export function deleteContentCategory(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/content-categories/${id}`, method: 'delete' })
}

/** PUT /admin/v1/content-categories/:id/status —— 启停 */
export function setContentCategoryStatus(
  id: number,
  status: number,
): Promise<ApiEnvelope<ContentCategoryItem>> {
  return request<ContentCategoryItem>({ url: `/v1/content-categories/${id}/status`, method: 'put', data: { status } })
}
