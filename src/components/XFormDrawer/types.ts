/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   XFormDrawer 配置 schema（编辑抽屉范式，create/update 场景复用）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * +----------------------------------------------------------------------
 */
import type { ApiEnvelope } from '@/utils/request'
import type { OptionItem, Row } from '@/components/XTable/types'

export type FormMode = 'create' | 'update'

/** 表单项 */
export interface FormItem {
  prop: string
  label: string
  /**
   * 控件类型：input / textarea / select（dict 或静态 options）/ switch /
   * number / radio / treeSelect（部门树、父级菜单等）
   */
  type: 'input' | 'textarea' | 'select' | 'switch' | 'number' | 'radio' | 'treeSelect'
  /** 必填（对接后端 sceneCreate 必填字段；sceneUpdate 选择性由 visible/payload 收口） */
  required?: boolean
  requiredMessage?: string
  /** 编辑场景禁改（如 code 唯一标识）；update 提交时该字段不参与 payload */
  disabledOnEdit?: boolean
  /** select/radio 取数：M2-A 字典类型（注意字典 value 为字符串） */
  dict?: string
  /** select/radio 静态选项 */
  options?: OptionItem[]
  /** switch 开/关值，默认 1/0 */
  activeValue?: number
  inactiveValue?: number
  /** number 控件范围 */
  min?: number
  max?: number
  /** treeSelect：多选 / 父子独立勾选 */
  multiple?: boolean
  checkStrictly?: boolean
  /** treeSelect 取数（懒加载：项首次可见时调用，每次打开抽屉重新拉取） */
  treeData?: () => Promise<Row[]>
  /** treeSelect 字段映射，默认 label:'title' children:'children'（节点值固定取 id） */
  treeProps?: { label?: string; children?: string }
  placeholder?: string
  /** 新增场景默认值（缺省按控件类型：switch=activeValue、number=0、多选=[]、其余 ''） */
  defaultValue?: unknown
  /**
   * 条件显隐（联动范式，模块特化点）：如 menu 按 type 切换字段、role 的
   * data_scope=5 才显部门树。不可见项不渲染、不校验、不参与提交 payload。
   */
  visible?: (form: Row, mode: FormMode) => boolean
  /** 表单项下方说明文字 */
  tip?: string
}

/** XFormDrawer 总配置 */
export interface XFormDrawerConfig {
  /** 模块中文名（抽屉标题 = 「新增/编辑 + entity」） */
  entity: string
  /** 抽屉宽度，默认 480 */
  width?: number | string
  labelWidth?: string
  items: FormItem[]
  /** 消费 api 层：save 对接 sceneCreate、update 对接 sceneUpdate（选择性字段） */
  api: {
    save: (data: Record<string, unknown>) => Promise<ApiEnvelope<unknown>>
    update: (id: number, data: Record<string, unknown>) => Promise<ApiEnvelope<unknown>>
  }
  /** 编辑回显取数（detail 聚合，如角色需 dept_ids）；缺省直接用列表行数据回显 */
  detail?: (id: number) => Promise<ApiEnvelope<Row>>
  /** 行主键，默认 'id' */
  rowKey?: string
}
