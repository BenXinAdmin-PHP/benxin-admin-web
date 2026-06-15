/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   素材分类接口（树 + CRUD + 状态 — /admin/v1/resource-categories）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-15
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** 素材分类树节点（管理端全字段；children 仅在有子节点时存在） */
export interface ResourceCategoryItem {
  id: number
  parent_id: number
  name: string
  sort: number
  status: number
  remark: string
  create_by: number
  created_at: string | null
  updated_at: string | null
  children?: ResourceCategoryItem[]
}

/** GET /admin/v1/resource-categories/tree —— 完整素材分类树（无分页） */
export function getResourceCategoryTree(): Promise<ApiEnvelope<ResourceCategoryItem[]>> {
  return request<ResourceCategoryItem[]>({ url: '/v1/resource-categories/tree', method: 'get' })
}

/** GET /admin/v1/resource-categories/:id —— 详情 */
export function getResourceCategory(id: number): Promise<ApiEnvelope<ResourceCategoryItem>> {
  return request<ResourceCategoryItem>({ url: `/v1/resource-categories/${id}`, method: 'get' })
}

/** POST /admin/v1/resource-categories —— 新增（sceneCreate：name 必填） */
export function createResourceCategory(
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ResourceCategoryItem>> {
  return request<ResourceCategoryItem>({ url: '/v1/resource-categories', method: 'post', data })
}

/** PUT /admin/v1/resource-categories/:id —— 更新（选择性字段；防自指/成环在后端） */
export function updateResourceCategory(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ResourceCategoryItem>> {
  return request<ResourceCategoryItem>({ url: `/v1/resource-categories/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/resource-categories/:id —— 删除（有子节点 / 有素材绑定 → 422） */
export function deleteResourceCategory(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/resource-categories/${id}`, method: 'delete' })
}

/** PUT /admin/v1/resource-categories/:id/status —— 启停 */
export function setResourceCategoryStatus(
  id: number,
  status: number,
): Promise<ApiEnvelope<ResourceCategoryItem>> {
  return request<ResourceCategoryItem>({
    url: `/v1/resource-categories/${id}/status`,
    method: 'put',
    data: { status },
  })
}
