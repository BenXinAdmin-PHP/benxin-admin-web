/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   字典接口（取数 + 类型 CRUD + 数据项 CRUD — /admin/v1/dicts·dict-data）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * | @updated   2026-06-14（手工槽：类型/数据项两级 CRUD，承载字典管理页）
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 字典数据项（取数视图：后端只回启用项，已按 sort 升序，供 useDict/下拉/标签） */
export interface DictDataItem {
  label: string
  /** 注意：库表为字符串，如 sys_normal_disable 的 '1'/'0' */
  value: string
  /** 标签样式：success/danger/warning/info/primary/空 */
  list_class: string
  is_default: number
  sort: number
}

/** GET /admin/v1/dicts/type/:type —— 按类型取启用字典项（后端带 Valkey 缓存） */
export function getDictByType(type: string): Promise<ApiEnvelope<DictDataItem[]>> {
  return request<DictDataItem[]>({ url: `/v1/dicts/type/${type}`, method: 'get' })
}

/* ============================ 字典类型 CRUD ============================ */

/** 字典类型行 */
export interface DictItem {
  id: number
  tenant_id: number
  name: string
  type: string
  status: number
  remark: string
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/dicts —— 类型分页列表（keyword/status 筛选） */
export function listDicts(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<DictItem>>> {
  return request<PageResult<DictItem>>({ url: '/v1/dicts', method: 'get', params })
}

/** POST /admin/v1/dicts —— 新增类型 */
export function createDict(data: Record<string, unknown>): Promise<ApiEnvelope<DictItem>> {
  return request<DictItem>({ url: '/v1/dicts', method: 'post', data })
}

/** PUT /admin/v1/dicts/:id —— 更新类型 */
export function updateDict(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<DictItem>> {
  return request<DictItem>({ url: `/v1/dicts/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/dicts/:id —— 删除类型（级联删数据项 + 失效缓存） */
export function deleteDict(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/dicts/${id}`, method: 'delete' })
}

/** PUT /admin/v1/dicts/:id/status —— 启停类型 */
export function setDictStatus(id: number, status: number): Promise<ApiEnvelope<DictItem>> {
  return request<DictItem>({ url: `/v1/dicts/${id}/status`, method: 'put', data: { status } })
}

/* ============================ 字典数据项 CRUD ============================ */

/** 字典数据项行（管理视图，全字段） */
export interface DictDataRow {
  id: number
  tenant_id: number
  dict_type: string
  label: string
  value: string
  sort: number
  status: number
  list_class: string
  is_default: number
  remark: string
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/dict-data —— 数据项分页列表（dict_type/keyword/status 筛选） */
export function listDictData(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<DictDataRow>>> {
  return request<PageResult<DictDataRow>>({ url: '/v1/dict-data', method: 'get', params })
}

/** POST /admin/v1/dict-data —— 新增数据项 */
export function createDictData(data: Record<string, unknown>): Promise<ApiEnvelope<DictDataRow>> {
  return request<DictDataRow>({ url: '/v1/dict-data', method: 'post', data })
}

/** PUT /admin/v1/dict-data/:id —— 更新数据项 */
export function updateDictData(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiEnvelope<DictDataRow>> {
  return request<DictDataRow>({ url: `/v1/dict-data/${id}`, method: 'put', data })
}

/** DELETE /admin/v1/dict-data/:id —— 删除数据项（失效缓存） */
export function deleteDictData(id: number): Promise<ApiEnvelope<null>> {
  return request<null>({ url: `/v1/dict-data/${id}`, method: 'delete' })
}

/** PUT /admin/v1/dict-data/:id/status —— 启停数据项 */
export function setDictDataStatus(id: number, status: number): Promise<ApiEnvelope<DictDataRow>> {
  return request<DictDataRow>({ url: `/v1/dict-data/${id}/status`, method: 'put', data: { status } })
}
