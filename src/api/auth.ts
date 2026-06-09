/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   认证接口（登录/刷新/登出/个人信息/自助改密）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-09
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** 登录返回的令牌组 */
export interface LoginTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
}

/** profile 菜单节点（目录/菜单，含 children） */
export interface MenuNode {
  id: number
  parent_id: number
  type: number
  name: string
  title: string
  path: string
  component: string
  icon: string
  sort: number
  children?: MenuNode[]
}

/** 当前管理员聚合信息（动态路由 + 按钮权限契约） */
export interface ProfileData {
  user: {
    id: number
    username: string
    nickname: string
    avatar: string
    mobile: string
    email: string
    dept_id: number
  }
  roles: string[]
  menus: MenuNode[]
  perms: string[]
}

/** POST /admin/v1/login */
export function login(username: string, password: string): Promise<ApiEnvelope<LoginTokens>> {
  return request<LoginTokens>({ url: '/v1/login', method: 'post', data: { username, password } })
}

/** POST /admin/v1/logout */
export function logout(): Promise<ApiEnvelope<null>> {
  return request<null>({ url: '/v1/logout', method: 'post' })
}

/** GET /admin/v1/profile */
export function getProfile(): Promise<ApiEnvelope<ProfileData>> {
  return request<ProfileData>({ url: '/v1/profile', method: 'get' })
}

/** PUT /admin/v1/password —— 自助改密（改后需重新登录） */
export function changePassword(
  old_password: string,
  new_password: string,
): Promise<ApiEnvelope<null>> {
  return request<null>({ url: '/v1/password', method: 'put', data: { old_password, new_password } })
}
