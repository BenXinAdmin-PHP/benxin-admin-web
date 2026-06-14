/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   管理员接口（CRUD + 状态 + 重置密码 + 角色/岗位分配 — /admin/v1/admins）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-12
 * | @updated   2026-06-14（手工槽：重置密码 + 详情 role_ids/post_ids 分配回显）
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 管理员行（列表/详情共用；输出不含 password；详情额外带 role_ids/post_ids） */
export interface AdminItem {
  id: number
  tenant_id: number
  username: string
  nickname: string
  avatar: string
  mobile: string
  email: string
  dept_id: number
  status: number
  last_login_at: string | null
  last_login_ip: string
  remark: string
  created_at: string | null
  updated_at: string | null
  role_ids?: number[]
  post_ids?: number[]
}

/** GET /admin/v1/admins —— 分页列表（keyword/dept_id/status 筛选） */
export function listAdmins(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<AdminItem>>> {
  return request<PageResult<AdminItem>>({ url: '/v1/admins', method: 'get', params })
}

/** GET /admin/v1/admins/:id —— 详情（含 role_ids/post_ids，编辑回显） */
export function getAdmin(id: number): Promise<ApiEnvelope<AdminItem>> {
  return request<AdminItem>({ url: `/v1/admins/${id}`, method: 'get' })
}

/** POST /admin/v1/admins —— 新增（password 必填，可带 role_ids/post_ids） */
export function createAdmin(data: Record<string, unknown>): Promise<ApiEnvelope<AdminItem>> {
  return request<AdminItem>({ url: '/v1/admins', method: 'post', data })
}

/** PUT /admin/v1/admins/:id —— 更新（选择性字段；不改密码；可重设 role_ids/post_ids） */
export function updateAdmin(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<AdminItem>> {
  return request<AdminItem>({ url: `/v1/admins/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/admins/:id —— 删除 */
export function deleteAdmin(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/admins/${id}`, method: 'delete' })
}

/** PUT /admin/v1/admins/:id/status —— 启停 */
export function setAdminStatus(id: number, status: number): Promise<ApiEnvelope<AdminItem>> {
  return request<AdminItem>({ url: `/v1/admins/${id}/status`, method: 'put', data: { status } })
}

/** PUT /admin/v1/admins/:id/password —— 管理员重置他人密码 */
export function resetAdminPassword(id: number, password: string): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/admins/${id}/password`, method: 'put', data: { password } })
}
