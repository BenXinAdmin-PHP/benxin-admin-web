/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   素材接口（CRUD + 批量删 + 上传(进度) + VOD 直传签发/回填 — /admin/v1/resources）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-15
 * +----------------------------------------------------------------------
 */
import service, { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** VOD 未开通错误码（后端 ErrorCode::RESOURCE_VOD_NOT_READY，前端据此回退本地上传） */
export const RESOURCE_VOD_NOT_READY = 422101

/**
 * 服务端中转上传（A 链路）前端大小上限 MB——超此值直接前端拦截、不发注定被 PHP 限额拒的废请求。
 *
 * ★必须与后端对齐：取 min(php.ini post_max_size, upload_max_filesize) 与素材 app 层上限(100MB)的较小值。
 *   默认 8（对齐 PHP 默认 post_max_size=8M，最保守；实际单文件还受 upload_max_filesize 默认 2M 约束）。
 *   **调大 php.ini（README「大文件上传配置」）后，请同步调大此常量。**
 *   VOD 客户端直传（B 链路）走腾讯 SDK、不经 PHP，不受此限——大视频请开通 VOD。
 */
export const RESOURCE_MAX_UPLOAD_MB = 8

/** 素材行（列表/详情共用） */
export interface ResourceItem {
  id: number
  category_id: number
  name: string
  media_type: string
  storage: string
  path: string
  url: string
  file_name: string
  original_name: string
  ext: string
  mime: string
  size: number
  hash: string
  vod_media_id: string
  transcode_status: number
  created_at: string | null
  updated_at: string | null
}

/** 服务端中转上传返回（A 链路，与后端 ResourceService::upload 对齐） */
export interface ResourceUploadResult {
  id: number
  name: string
  media_type: string
  storage: string
  url: string
  size: number
  mime: string
  ext: string
}

/** VOD 上传凭证（B 链路，与后端 BxVod::signUpload 对齐） */
export interface VodSignResult {
  signature: string
  sub_app_id: number
  procedure: string
  expire: number
  region: string
}

/** VOD 直传回填结果（B 链路，与后端 ResourceService::vodConfirm 对齐） */
export interface VodConfirmResult {
  id: number
  name: string
  media_type: string
  storage: string
  vod_media_id: string
  url: string
  transcode_status: number
}

/** GET /admin/v1/resources —— 分页列表（keyword 模糊 name，category_id 精确，media_type 精确） */
export function listResources(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<ResourceItem>>> {
  return request<PageResult<ResourceItem>>({ url: '/v1/resources', method: 'get', params })
}

/** GET /admin/v1/resources/:id —— 详情 */
export function getResource(id: number): Promise<ApiEnvelope<ResourceItem>> {
  return request<ResourceItem>({ url: `/v1/resources/${id}`, method: 'get' })
}

/** PUT /admin/v1/resources/:id —— 更新（仅 name/category_id，物理字段后端 readonly） */
export function updateResource(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<ResourceItem>> {
  return request<ResourceItem>({ url: `/v1/resources/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/resources/:id —— 删除（软删 + 物理删容错） */
export function deleteResource(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/resources/${id}`, method: 'delete' })
}

/** DELETE /admin/v1/resources/batch —— 批量删（事务软删 + 各 storage 物理删容错） */
export function batchDeleteResources(
  ids: number[],
): Promise<ApiEnvelope<{ deleted: number; physical_failed: number[] }>> {
  return request<{ deleted: number; physical_failed: number[] }>({
    url: '/v1/resources/batch',
    method: 'delete',
    data: { ids },
  })
}

/**
 * POST /admin/v1/resources/upload —— A 链路：服务端中转上传（multipart 字段名 file）。
 * 本地/七牛/OSS 由后端 forMediaType 路由；onProgress 回传 0~100 上传百分比。
 */
export function uploadResource(
  file: File,
  categoryId = 0,
  onProgress?: (percent: number) => void,
): Promise<ApiEnvelope<ResourceUploadResult>> {
  const data = new FormData()
  data.append('file', file)
  if (categoryId > 0) data.append('category_id', String(categoryId))
  return service({
    url: '/v1/resources/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  }) as unknown as Promise<ApiEnvelope<ResourceUploadResult>>
}

/**
 * POST /admin/v1/resources/vod/upload-sign —— B 链路：签发 VOD 直传上传凭证。
 * silent=true 时未开通(422101)不弹全局提示，由调用方静默回退本地（守 §1 默认可跑）。
 */
export function vodUploadSign(
  params: { media_type: string; file_name?: string; expire?: number },
  silent = false,
): Promise<ApiEnvelope<VodSignResult>> {
  return request<VodSignResult>({
    url: '/v1/resources/vod/upload-sign',
    method: 'post',
    data: params,
    silent,
  })
}

/** POST /admin/v1/resources/vod/confirm —— B 链路：直传完成回填落库 */
export function vodConfirm(data: Record<string, unknown>): Promise<ApiEnvelope<VodConfirmResult>> {
  return request<VodConfirmResult>({ url: '/v1/resources/vod/confirm', method: 'post', data })
}

// ====================== 前端媒体工具（与后端口径一致，仅辅助体验） ======================

/** 按 media_type 分组的扩展名（与后端 ResourceService::DEFAULT_ALLOW 同口径，仅前端粗判，真校验在后端） */
const EXT_GROUPS: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  video: ['mp4', 'webm', 'mov', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
}

/** 按文件名扩展名粗判 media_type（最终以后端归类为准）；未知返回空串 */
export function guessMediaType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  for (const [type, exts] of Object.entries(EXT_GROUPS)) {
    if (exts.includes(ext)) return type
  }
  return ''
}

/** media_type → 标签展示（label + el-tag type） */
export const MEDIA_TYPE_OPTIONS = [
  { label: '图片', value: 'image', tagType: 'success' },
  { label: '视频', value: 'video', tagType: 'primary' },
  { label: '音频', value: 'audio', tagType: 'warning' },
  { label: '文档', value: 'document', tagType: 'info' },
  { label: '压缩包', value: 'archive', tagType: 'info' },
]

/** 转码态枚举（仅 VOD 资源有意义，ADR-19）：0 无需 / 1 上传中 / 2 转码中 / 3 可播放 / 4 失败 */
export const TRANSCODE_STATUS: Record<number, { label: string; tagType: string }> = {
  0: { label: '可用', tagType: 'success' },
  1: { label: '待转码', tagType: 'info' },
  2: { label: '转码中', tagType: 'warning' },
  3: { label: '可播放', tagType: 'success' },
  4: { label: '转码失败', tagType: 'danger' },
}

/** 字节 → 人类可读 */
export function humanSize(bytes: unknown): string {
  let n = Number(bytes ?? 0)
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 受控取流路由（本地资源；云/VOD 直接用列表返回的 url） */
export function resourceRawUrl(id: number): string {
  return `/admin/v1/resources/${id}/raw`
}
