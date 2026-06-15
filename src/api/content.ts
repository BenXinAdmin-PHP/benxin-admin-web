/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   内容接口（CRUD + 状态 — /admin/v1/contents）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-12
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 内容行（列表/详情共用） */
export interface ContentItem {
  id: number
  tenant_id: number
  category_id: number
  title: string
  cover: string
  summary: string
  content: string
  author: string
  source: string
  /** 状态：0草稿 1已发布 2已下架 */
  status: number
  is_top: number
  sort: number
  /** 浏览量（服务端维护，只读） */
  view_count: number
  publish_at: string | null
  create_by: number
  create_dept: number
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/contents —— 分页列表（keyword 模糊 title，category_id 精确，status 精确） */
export function listContents(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<ContentItem>>> {
  return request<PageResult<ContentItem>>({ url: '/v1/contents', method: 'get', params })
}

/** GET /admin/v1/contents/:id —— 详情 */
export function getContent(id: number): Promise<ApiEnvelope<ContentItem>> {
  return request<ContentItem>({ url: `/v1/contents/${id}`, method: 'get' })
}

/** POST /admin/v1/contents —— 新增（sceneCreate：category_id/title/content 必填） */
export function createContent(data: Record<string, unknown>): Promise<ApiEnvelope<ContentItem>> {
  return request<ContentItem>({ url: '/v1/contents', method: 'post', data })
}

/** PUT /admin/v1/contents/:id —— 更新（选择性字段） */
export function updateContent(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ContentItem>> {
  return request<ContentItem>({ url: `/v1/contents/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/contents/:id —— 删除 */
export function deleteContent(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/contents/${id}`, method: 'delete' })
}

/** PUT /admin/v1/contents/:id/status —— 启停 */
export function setContentStatus(id: number, status: number): Promise<ApiEnvelope<ContentItem>> {
  return request<ContentItem>({ url: `/v1/contents/${id}/status`, method: 'put', data: { status } })
}
