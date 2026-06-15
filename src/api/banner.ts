/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   广告位接口（CRUD + 状态 — /admin/v1/banners）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-12
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 广告位行（列表/详情共用） */
export interface BannerItem {
  id: number
  tenant_id: number
  title: string
  image: string
  link: string
  position: string
  sort: number
  status: number
  start_at: string | null
  end_at: string | null
  create_by: number
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/banners —— 分页列表（keyword 模糊 title/position，status 精确） */
export function listBanners(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<BannerItem>>> {
  return request<PageResult<BannerItem>>({ url: '/v1/banners', method: 'get', params })
}

/** GET /admin/v1/banners/:id —— 详情 */
export function getBanner(id: number): Promise<ApiEnvelope<BannerItem>> {
  return request<BannerItem>({ url: `/v1/banners/${id}`, method: 'get' })
}

/** POST /admin/v1/banners —— 新增（sceneCreate：title/image/position 必填） */
export function createBanner(data: Record<string, unknown>): Promise<ApiEnvelope<BannerItem>> {
  return request<BannerItem>({ url: '/v1/banners', method: 'post', data })
}

/** PUT /admin/v1/banners/:id —— 更新（选择性字段） */
export function updateBanner(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<BannerItem>> {
  return request<BannerItem>({ url: `/v1/banners/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/banners/:id —— 删除 */
export function deleteBanner(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/banners/${id}`, method: 'delete' })
}

/** PUT /admin/v1/banners/:id/status —— 启停 */
export function setBannerStatus(id: number, status: number): Promise<ApiEnvelope<BannerItem>> {
  return request<BannerItem>({ url: `/v1/banners/${id}/status`, method: 'put', data: { status } })
}
