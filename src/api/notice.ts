/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   系统公告接口（CRUD + 状态 — /admin/v1/notices）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-13
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 系统公告行（列表/详情共用） */
export interface NoticeItem {
  id: number
  tenant_id: number
  title: string
  type: number
  content: string
  /** 状态：0草稿 1已发布 2已下架 */
  status: number
  is_top: number
  sort: number
  publish_at: string | null
  create_by: number
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/notices —— 分页列表（keyword 模糊 title，type 精确，status 精确） */
export function listNotices(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<NoticeItem>>> {
  return request<PageResult<NoticeItem>>({ url: '/v1/notices', method: 'get', params })
}

/** GET /admin/v1/notices/:id —— 详情 */
export function getNotice(id: number): Promise<ApiEnvelope<NoticeItem>> {
  return request<NoticeItem>({ url: `/v1/notices/${id}`, method: 'get' })
}

/** POST /admin/v1/notices —— 新增（sceneCreate：title/type/content 必填） */
export function createNotice(data: Record<string, unknown>): Promise<ApiEnvelope<NoticeItem>> {
  return request<NoticeItem>({ url: '/v1/notices', method: 'post', data })
}

/** PUT /admin/v1/notices/:id —— 更新（选择性字段） */
export function updateNotice(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<NoticeItem>> {
  return request<NoticeItem>({ url: `/v1/notices/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/notices/:id —— 删除 */
export function deleteNotice(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/notices/${id}`, method: 'delete' })
}

/** PUT /admin/v1/notices/:id/status —— 启停 */
export function setNoticeStatus(id: number, status: number): Promise<ApiEnvelope<NoticeItem>> {
  return request<NoticeItem>({ url: `/v1/notices/${id}/status`, method: 'put', data: { status } })
}
