/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   页面搭建接口（CRUD — /admin/v1/pages，供 M6-C 搭建器消费）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-17
 * +----------------------------------------------------------------------
 * 对接 M6-B admin 端点（perms：system:page:list/save/delete）。
 * 详情/列表返回原始 blocks（i18n {zh,en} 对象，非渲染态）；保存提交整页 blocks 数组，
 * 后端 PageService::validateBlocks 为权威校验闸，前端描述符漂移由 422 兜底。
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 区块（有序数组元素）；type 走白名单，其余字段形状由 BLOCK_FORM_SCHEMA 约束，组件层宽松 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Block = { type: string; [key: string]: any }

/** 页面行（admin 详情含原始 blocks JSON；列表行 blocks 亦原样返回） */
export interface PageItem {
  id: number
  slug: string
  title: string
  status: number
  blocks: Block[]
  create_by?: number | null
  create_dept?: number | null
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/pages —— 分页列表（keyword: title/slug；status 精确） */
export function listPages(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<PageItem>>> {
  return request<PageResult<PageItem>>({ url: '/v1/pages', method: 'get', params })
}

/** GET /admin/v1/pages/:id —— 详情（含原始 blocks，供搭建器编辑） */
export function getPage(id: number): Promise<ApiEnvelope<PageItem>> {
  return request<PageItem>({ url: `/v1/pages/${id}`, method: 'get' })
}

/** POST /admin/v1/pages —— 新建（slug + title + status + blocks） */
export function createPage(data: Record<string, unknown>): Promise<ApiEnvelope<PageItem>> {
  return request<PageItem>({ url: '/v1/pages', method: 'post', data })
}

/** PUT /admin/v1/pages/:id —— 整页更新（提交 {title,status,blocks}） */
export function updatePage(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<PageItem>> {
  return request<PageItem>({ url: `/v1/pages/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/pages/:id —— 删除（软删） */
export function deletePage(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/pages/${id}`, method: 'delete' })
}
