/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   字典取数接口（M2-A — GET /admin/v1/dicts/type/:type）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope } from '@/utils/request'

/** 字典数据项（后端只回启用项，已按 sort 升序） */
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
