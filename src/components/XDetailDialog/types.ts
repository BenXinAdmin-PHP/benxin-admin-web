/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   XDetailDialog 字段 schema（只读详情渲染）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 */
import type { Row } from '@/components/XTable/types'

/** 详情字段定义：prop 取值键，label 标签，formatter 可选格式化（时间/枚举翻译），span 跨列 */
export interface DetailField {
  prop: string
  label: string
  formatter?: (val: unknown, row: Row) => string
  span?: number
}
