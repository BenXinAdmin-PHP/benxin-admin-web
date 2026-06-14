/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   文件接口（上传 + 受控下载取流 — /admin/v1/files，M2-D 通道复用）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-12
 * | @updated   2026-06-14（手工槽：文件管理列表 + 删除）
 * +----------------------------------------------------------------------
 */
import service, { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 上传返回（与后端 FileService::upload 对齐） */
export interface UploadResult {
  id: number
  url: string
  original_name: string
  size: number
  mime: string
  ext: string
}

/** 文件记录行（管理列表） */
export interface FileItem {
  id: number
  tenant_id: number
  original_name: string
  file_name: string
  path: string
  mime: string
  ext: string
  size: number
  storage: string
  hash: string
  url: string
  created_at: string | null
}

/** GET /admin/v1/files —— 文件分页列表（ext/mime/keyword/时间范围筛选；数据权限 ADR-9） */
export function listFiles(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<FileItem>>> {
  return request<PageResult<FileItem>>({ url: '/v1/files', method: 'get', params })
}

/** DELETE /admin/v1/files/:id —— 删除（软删，物理文件保留） */
export function deleteFile(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/files/${id}`, method: 'delete' })
}

/**
 * POST /admin/v1/files/upload —— 图片/文件上传（multipart 字段名 file）。
 * 后端 §8 上传安全：finfo 真实 MIME + 扩展名白名单 + uuid 重命名 + 存非 Web 目录。
 */
export function uploadFile(file: File): Promise<ApiEnvelope<UploadResult>> {
  const data = new FormData()
  data.append('file', file)
  return request<UploadResult>({
    url: '/v1/files/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 受控文件 URL → 带鉴权取流为本地 ObjectURL（用于 <img>/el-image 预览）。
 *
 * 本地驱动的文件 URL 为受控下载路由（/admin/v1/files/:id/raw，需 Bearer token），
 * <img src> 无法携带鉴权头直链，故经 axios 取 blob 再 createObjectURL。
 * 云驱动（OSS/七牛）返回公网 URL，直接原样返回。
 * 用完记得 releaseBlobUrl 释放（组件卸载/替换时）。
 */
export async function resolvePreviewUrl(url: string): Promise<string> {
  if (!url.startsWith('/admin/')) {
    return url
  }
  // baseURL 已含 /admin 前缀，去重后取流
  const resp = await service({ url: url.replace(/^\/admin/, ''), method: 'get', responseType: 'blob' })
  return URL.createObjectURL(resp.data as Blob)
}

/** 释放 resolvePreviewUrl 生成的 ObjectURL（非 blob: 协议忽略） */
export function releaseBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
