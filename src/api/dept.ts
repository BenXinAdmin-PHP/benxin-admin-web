/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   部门接口（树取数 — /admin/v1/depts/tree，供 data_scope=5 部门树多选）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** 部门树节点 */
export interface DeptItem {
  id: number
  parent_id: number
  name: string
  sort: number
  status: number
  children?: DeptItem[]
}

/** GET /admin/v1/depts/tree —— 完整部门树（无分页） */
export function getDeptTree(): Promise<ApiEnvelope<DeptItem[]>> {
  return request<DeptItem[]>({ url: '/v1/depts/tree', method: 'get' })
}
