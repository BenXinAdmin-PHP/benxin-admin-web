/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   BLOCK_FORM_SCHEMA 描述符（搭建器呈现层单源，M6-C / ADR-22）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-17
 * +----------------------------------------------------------------------
 * 块类型 → 字段定义。单源驱动三处：新块默认值 / 中栏预览 / 右栏表单。
 * 与 M6-B §4 区块契约（PageService::BLOCK_SCHEMA）逐 type 对齐：
 *   i18n-text/i18n-textarea → {zh,en}（后端 kind=i18n，zh 必填非空）；
 *   text/textarea           → 纯标量（后端 kind=text）；
 *   i18n-list               → [{zh,en}]（后端 kind=arrayOfI18n）；
 *   object                  → 嵌套对象（后端 kind=object，按 subFields）；
 *   object-list             → 对象数组（后端 kind=arrayOfObject，按 subFields）。
 * 后端 validateBlocks 为权威校验闸；前端描述符漂移由保存 422 兜底（不假成功）。
 */
import type { Block } from '@/api/page'

/** 字段控件类型 */
export type Widget =
  | 'i18n-text'
  | 'i18n-textarea'
  | 'text'
  | 'textarea'
  | 'i18n-list'
  | 'object'
  | 'object-list'

/** i18n 文本值（zh 必填、en 可空、渲染回退 zh） */
export interface I18nValue {
  zh: string
  en: string
}

/** 字段定义 */
export interface FieldDef {
  key: string
  label: string
  widget: Widget
  required?: boolean
  /** object / object-list 的子字段 */
  subFields?: FieldDef[]
  /** text 控件的枚举选项（如 cta.buttons.variant → el-select） */
  options?: { label: string; value: string }[]
  placeholder?: string
}

/** 块类型元信息（左栏面板 + 画布标题；icon 为 @element-plus/icons-vue 组件名） */
export interface BlockTypeMeta {
  type: string
  label: string
  icon: string
}

/** 8 种块类型（顺序 = 左栏面板呈现顺序，对齐 M6-A 首页区块） */
export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: 'hero', label: '主视觉 Hero', icon: 'Monitor' },
  { type: 'prose', label: '文字段落', icon: 'Document' },
  { type: 'feature-grid', label: '特性网格', icon: 'Grid' },
  { type: 'moat', label: '护城河', icon: 'MagicStick' },
  { type: 'security', label: '安全亮点', icon: 'Lock' },
  { type: 'badge-list', label: '技术栈', icon: 'CollectionTag' },
  { type: 'showcase', label: '截图墙', icon: 'PictureRounded' },
  { type: 'cta', label: '行动号召 CTA', icon: 'Promotion' },
]

/** type → 中文名（画布/表单标题用） */
export const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPES.map((b) => [b.type, b.label]),
)

/** 块类型 → 字段描述符（呈现层单源） */
export const BLOCK_FORM_SCHEMA: Record<string, FieldDef[]> = {
  hero: [
    { key: 'eyebrow', label: '标签文字', widget: 'i18n-text', required: true },
    { key: 'title', label: '主标题', widget: 'i18n-text', required: true },
    { key: 'subtitle', label: '副标题', widget: 'i18n-textarea', required: true },
    {
      key: 'ctaPrimary',
      label: '主按钮',
      widget: 'object',
      required: true,
      subFields: [
        { key: 'text', label: '按钮文字', widget: 'i18n-text', required: true },
        { key: 'href', label: '链接', widget: 'text' },
      ],
    },
    {
      key: 'ctaSecondary',
      label: '次按钮',
      widget: 'object',
      required: true,
      subFields: [
        { key: 'text', label: '按钮文字', widget: 'i18n-text', required: true },
        { key: 'href', label: '链接', widget: 'text' },
      ],
    },
  ],
  prose: [
    { key: 'title', label: '标题', widget: 'i18n-text', required: true },
    { key: 'body', label: '正文', widget: 'i18n-textarea', required: true },
  ],
  'feature-grid': [
    { key: 'title', label: '区块标题', widget: 'i18n-text', required: true },
    {
      key: 'items',
      label: '特性卡片',
      widget: 'object-list',
      required: true,
      subFields: [
        { key: 'icon', label: '图标名', widget: 'text', placeholder: '如 Lock / Grid' },
        { key: 'title', label: '卡片标题', widget: 'i18n-text', required: true },
        { key: 'desc', label: '卡片描述', widget: 'i18n-textarea', required: true },
      ],
    },
  ],
  moat: [
    { key: 'title', label: '标题', widget: 'i18n-text', required: true },
    { key: 'body', label: '正文', widget: 'i18n-textarea', required: true },
    { key: 'verifyCaption', label: '校验徽章文字', widget: 'i18n-text' },
  ],
  security: [
    { key: 'title', label: '标题', widget: 'i18n-text', required: true },
    { key: 'body', label: '正文', widget: 'i18n-textarea', required: true },
    { key: 'chips', label: '安全标签', widget: 'i18n-list', required: true },
  ],
  'badge-list': [
    { key: 'title', label: '区块标题', widget: 'i18n-text', required: true },
    { key: 'caption', label: '副说明', widget: 'i18n-text' },
    {
      key: 'items',
      label: '技术徽章',
      widget: 'object-list',
      required: true,
      subFields: [{ key: 'label', label: '技术名', widget: 'text', required: true }],
    },
  ],
  showcase: [
    { key: 'title', label: '区块标题', widget: 'i18n-text', required: true },
    {
      key: 'items',
      label: '展示项',
      widget: 'object-list',
      required: true,
      subFields: [
        { key: 'caption', label: '图注', widget: 'i18n-text', required: true },
        { key: 'image', label: '图片地址', widget: 'text', placeholder: 'https:// 或留空占位' },
      ],
    },
  ],
  cta: [
    { key: 'title', label: '标题', widget: 'i18n-text', required: true },
    { key: 'body', label: '正文', widget: 'i18n-textarea', required: true },
    {
      key: 'buttons',
      label: '按钮',
      widget: 'object-list',
      required: true,
      subFields: [
        { key: 'text', label: '按钮文字', widget: 'i18n-text', required: true },
        { key: 'href', label: '链接', widget: 'text' },
        {
          key: 'variant',
          label: '样式',
          widget: 'text',
          options: [
            { label: 'primary 主', value: 'primary' },
            { label: 'secondary 次', value: 'secondary' },
          ],
        },
      ],
    },
    { key: 'quickstart', label: '命令块', widget: 'textarea', placeholder: '可空；等宽显示' },
  ],
}

// ===================== 默认值生成（新增块空骨架） =====================

function emptyI18n(): I18nValue {
  return { zh: '', en: '' }
}

/** 单字段默认值（必填数组给 1 个空项、可选数组给空） */
export function emptyFieldValue(field: FieldDef): unknown {
  switch (field.widget) {
    case 'i18n-text':
    case 'i18n-textarea':
      return emptyI18n()
    case 'text':
    case 'textarea':
      return ''
    case 'i18n-list':
      return field.required ? [emptyI18n()] : []
    case 'object':
      return buildObject(field.subFields ?? [])
    case 'object-list':
      return field.required ? [buildObject(field.subFields ?? [])] : []
    default:
      return ''
  }
}

/** 按 subFields 构建一个空对象（object 默认值 / 列表新增子项复用） */
export function buildObject(subFields: FieldDef[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const sf of subFields) {
    obj[sf.key] = emptyFieldValue(sf)
  }
  return obj
}

/** 新建一个空块（必填 i18n 给 {zh:'',en:''}、必填数组给 1 个空项） */
export function createEmptyBlock(type: string): Block {
  const fields = BLOCK_FORM_SCHEMA[type] ?? []
  const block: Block = { type }
  for (const f of fields) {
    block[f.key] = emptyFieldValue(f)
  }
  return block
}

// ===================== 保存序列化（剔除空可选字段，避免误触 422） =====================

function isI18nEmpty(v: unknown): boolean {
  const o = (v ?? {}) as Partial<I18nValue>
  return String(o.zh ?? '').trim() === '' && String(o.en ?? '').trim() === ''
}

function normI18n(v: unknown): I18nValue {
  const o = (v ?? {}) as Partial<I18nValue>
  return { zh: String(o.zh ?? ''), en: String(o.en ?? '') }
}

const OMIT = Symbol('omit')

/** 清洗单字段：返回待提交值，或 OMIT（空的可选字段不提交）。
 *  必填字段即便为空也保留——交后端 422 如实报错（不假成功）。 */
function cleanField(field: FieldDef, value: unknown): unknown | typeof OMIT {
  switch (field.widget) {
    case 'i18n-text':
    case 'i18n-textarea': {
      if (isI18nEmpty(value)) return field.required ? normI18n(value) : OMIT
      return normI18n(value)
    }
    case 'text':
    case 'textarea': {
      const s = String(value ?? '')
      if (s.trim() === '') return field.required ? s : OMIT
      return s
    }
    case 'i18n-list': {
      const arr = (Array.isArray(value) ? value : [])
        .filter((el) => !isI18nEmpty(el)) // 丢弃完全空白项
        .map((el) => normI18n(el))
      if (arr.length === 0) return field.required ? [] : OMIT
      return arr
    }
    case 'object': {
      return cleanObject(field.subFields ?? [], value)
    }
    case 'object-list': {
      const items: Record<string, unknown>[] = []
      for (const it of Array.isArray(value) ? value : []) {
        const obj = cleanObject(field.subFields ?? [], it)
        if (Object.keys(obj).length > 0) items.push(obj) // 丢弃完全空白项
      }
      if (items.length === 0) return field.required ? [] : OMIT
      return items
    }
    default:
      return OMIT
  }
}

/** 按 subFields 清洗一个对象（仅保留非 OMIT 字段） */
function cleanObject(subFields: FieldDef[], value: unknown): Record<string, unknown> {
  const src = (value ?? {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const sf of subFields) {
    const r = cleanField(sf, src[sf.key])
    if (r !== OMIT) out[sf.key] = r
  }
  return out
}

/**
 * 整页 blocks 保存序列化：按 schema 清洗每块字段。
 * - 空的可选 i18n / text / 列表 → 不提交（避免后端「{zh} 不能为空」误判）；
 * - 列表中完全空白项 → 丢弃；
 * - 必填字段即便空也保留 → 交后端 validateBlocks 422 定位报错。
 * 未知 type（描述符未覆盖）原样透传，交后端白名单 422 兜底。
 */
export function serializeBlocksForSave(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const fields = BLOCK_FORM_SCHEMA[block.type]
    if (!fields) return { ...block }
    const out: Block = { type: block.type }
    for (const f of fields) {
      const r = cleanField(f, block[f.key])
      if (r !== OMIT) out[f.key] = r
    }
    return out
  })
}

// ===================== 加载归一（后端原始 blocks → 可编辑结构） =====================

/** 归一单字段：补齐缺失结构（i18n→{zh,en}、数组→[]、object→子字段补全），保证表单可绑定 */
function normalizeField(field: FieldDef, value: unknown): unknown {
  switch (field.widget) {
    case 'i18n-text':
    case 'i18n-textarea':
      return normI18n(value)
    case 'text':
    case 'textarea':
      return String(value ?? '')
    case 'i18n-list': {
      const arr = (Array.isArray(value) ? value : []).map((el) => normI18n(el))
      return arr.length === 0 && field.required ? [emptyI18n()] : arr
    }
    case 'object':
      return normalizeObject(field.subFields ?? [], value)
    case 'object-list': {
      const arr = (Array.isArray(value) ? value : []).map((it) =>
        normalizeObject(field.subFields ?? [], it),
      )
      return arr.length === 0 && field.required
        ? [buildObject(field.subFields ?? [])]
        : arr
    }
    default:
      return value
  }
}

function normalizeObject(subFields: FieldDef[], value: unknown): Record<string, unknown> {
  const src = (value ?? {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const sf of subFields) {
    out[sf.key] = normalizeField(sf, src[sf.key])
  }
  return out
}

/**
 * 后端原始 blocks → 搭建器可编辑结构：按描述符补齐每块字段（含可选字段），
 * 确保 i18n 字段为 {zh,en}、数组字段为数组，FieldWidget 可直接双向绑定。
 * 未知 type 原样保留（画布显「未知区块」、保存交后端白名单 422）。
 */
export function normalizeBlocksForEdit(blocks: Block[]): Block[] {
  return (Array.isArray(blocks) ? blocks : []).map((block) => {
    const fields = BLOCK_FORM_SCHEMA[block.type]
    if (!fields) return { ...block }
    const out: Block = { type: block.type }
    for (const f of fields) {
      out[f.key] = normalizeField(f, block[f.key])
    }
    return out
  })
}
