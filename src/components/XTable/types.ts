/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   XTable 配置 schema（黄金样板核心靶子，M3-D1 生成器按此填配置）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * +----------------------------------------------------------------------
 */
import type { ApiEnvelope, PageResult } from '@/utils/request'

/** 表格行：后端 JSON 行对象（字段由各模块 API 类型约束，组件层面宽松） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

/** 静态选项（dictTag 列 / select 控件可用静态 options 替代字典取数） */
export interface OptionItem {
  label: string
  value: string | number
  /** el-tag 样式：success/danger/warning/info/primary（对应字典 list_class） */
  tagType?: string
}

/**
 * 模块 API 槽位（消费手写或 OpenAPI 生成的 api 层函数，签名对齐后端契约）：
 * - list：平铺模式传分页+搜索参数返回 PageResult；树形模式（tree:true）返回整树数组。
 * - save/update 由编辑抽屉（XFormDrawer）消费，挂在同一份配置便于 D1 一体生成。
 * - remove/status 由 XTable 内建处理（删除确认、状态开关回滚）。
 */
export interface XTableApi {
  list: (params: Record<string, unknown>) => Promise<ApiEnvelope<PageResult<Row> | Row[]>>
  save?: (data: Record<string, unknown>) => Promise<ApiEnvelope<unknown>>
  update?: (id: number, data: Record<string, unknown>) => Promise<ApiEnvelope<unknown>>
  remove?: (id: number) => Promise<ApiEnvelope<unknown>>
  status?: (id: number, status: number) => Promise<ApiEnvelope<unknown>>
}

/** 顶部搜索表单项 */
export interface SearchItem {
  /** 查询参数名（与后端 list 过滤参数对齐，如 keyword/status） */
  prop: string
  label: string
  /** 控件类型：input 文本 / select 下拉 / daterange 日期区间 */
  type: 'input' | 'select' | 'daterange'
  /** select 取数：M2-A 字典类型（与 options 二选一） */
  dict?: string
  /** select 静态选项 */
  options?: OptionItem[]
  placeholder?: string
  /** 控件宽度 px，默认 200 */
  width?: number
}

/** 表格列 */
export interface ColumnItem {
  prop: string
  label: string
  /**
   * 列类型：
   * - text（默认）：原样输出
   * - dictTag：经 dict/options 翻译为 el-tag
   * - time：时间字符串（默认宽 170）
   * - switch：状态开关，调 api.status，失败回滚；perm 缺失时禁用只读
   * - slot：具名插槽自定义（插槽名 = slot ?? prop）
   */
  type?: 'text' | 'dictTag' | 'time' | 'switch' | 'slot'
  /** dictTag 翻译源：字典类型 */
  dict?: string
  /** dictTag 翻译源：静态选项 */
  options?: OptionItem[]
  /** switch 列的写权限（无权限则禁用，不隐藏） */
  perm?: string
  /** switch 开/关值，默认 1/0 */
  activeValue?: number
  inactiveValue?: number
  width?: number | string
  minWidth?: number | string
  /** 客户端排序（当前页内） */
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  /** type:'slot' 时的插槽名，默认取 prop */
  slot?: string
}

/** 工具栏（目前仅新增按钮；按钮挂 v-permission，无权限隐藏） */
export interface ToolbarConfig {
  create?: {
    perm?: string
    /** 按钮文案，默认「新增」 */
    label?: string
  }
}

/** 操作列按钮 */
export interface RowAction {
  label: string
  /**
   * 动作名：emit==='remove' 且配置了 api.remove 时由 XTable 内建处理
   * （确认 → 调删除 → 刷新）；其余经 @action="(name,row)" 抛给页面。
   */
  emit: string
  /** 按钮权限（v-permission，无权限隐藏） */
  perm?: string
  /** 按钮色：默认 primary，删除类用 danger */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** 点击前确认：true 用默认文案，字符串为自定义文案 */
  confirm?: boolean | string
  /** 行级显隐（如 super_admin 行隐藏删除） */
  show?: (row: Row) => boolean
}

/** XTable 总配置：一份 config + <XTable :config="config" /> 即一个列表页 */
export interface XTableConfig {
  api: XTableApi
  /** 行主键，默认 'id' */
  rowKey?: string
  /** 树形 table：api.list 返回整树、不渲染分页与搜索折叠 */
  tree?: boolean
  /** 树形子节点字段，默认 'children' */
  childrenKey?: string
  /** 树形默认展开全部，默认 true */
  defaultExpandAll?: boolean
  search?: SearchItem[]
  columns: ColumnItem[]
  toolbar?: ToolbarConfig
  rowActions?: RowAction[]
  /** 操作列宽度，默认 180 */
  actionsWidth?: number
  /** 平铺模式每页条数，默认 15（后端 §6.3 默认值） */
  pageSize?: number
}
