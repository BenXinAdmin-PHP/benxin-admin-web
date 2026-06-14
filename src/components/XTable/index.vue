<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XTable 配置化表格（搜索 + 列表/树形 + 分页 + 工具栏 + 表格/卡片双视图 + 操作列 + v-permission）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-10
  | @updated   2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Grid, List } from '@element-plus/icons-vue'
import { useDict } from '@/composables/useDict'
import { useUserStore } from '@/stores/user'
import type { PageResult } from '@/utils/request'
import type { ColumnItem, OptionItem, Row, RowAction, SearchItem, XTableConfig } from './types'

const props = defineProps<{ config: XTableConfig }>()

const emit = defineEmits<{
  /** 工具栏/操作列动作：create（row 为 null）/ edit / assign / 自定义；remove 由内建处理不抛出 */
  action: [name: string, row: Row | null]
}>()

const userStore = useUserStore()
const config = props.config
const rowKey = config.rowKey ?? 'id'

// ---- 字典：收集 search/columns 引用到的字典类型，一次性挂取数（useDict 模块级缓存）----
const dictTypes = new Set(
  [...(config.search ?? []), ...config.columns]
    .map((it) => it.dict)
    .filter((t): t is string => !!t),
)
const dictRefs = new Map([...dictTypes].map((t) => [t, useDict(t)]))

/** select/dictTag 的选项源：静态 options 优先，否则按字典翻译（list_class → el-tag type） */
function optionsOf(it: { dict?: string; options?: OptionItem[] }): OptionItem[] {
  if (it.options) {
    return it.options
  }
  if (it.dict) {
    const dict = dictRefs.get(it.dict)?.value ?? []
    return dict.map((d) => ({ label: d.label, value: d.value, tagType: d.list_class }))
  }
  return []
}

/** dictTag 匹配（库值与字典 value 可能数字/字符串混用，统一字符串比较） */
function matchOption(col: ColumnItem, row: Row): OptionItem | undefined {
  return optionsOf(col).find((o) => String(o.value) === String(row[col.prop]))
}

const TAG_TYPES = ['success', 'warning', 'danger', 'info', 'primary'] as const
function tagTypeOf(opt: OptionItem | undefined): (typeof TAG_TYPES)[number] {
  const t = opt?.tagType ?? ''
  return (TAG_TYPES as readonly string[]).includes(t) ? (t as (typeof TAG_TYPES)[number]) : 'primary'
}

// ---- 取数 ----
const loading = ref(false)
const rows = ref<Row[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(config.pageSize ?? 15)
// 值类型随控件而变（input 字符串 / select 字典值 / daterange 数组），用 Row 宽松收口
const searchForm = reactive<Row>({})

function searchParams(): Record<string, unknown> {
  const params: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(searchForm)) {
    if (v === '' || v == null || (Array.isArray(v) && v.length === 0)) {
      continue
    }
    params[k] = v
  }
  return params
}

async function fetchData() {
  loading.value = true
  try {
    const params = config.tree
      ? searchParams()
      : { page: page.value, page_size: pageSize.value, ...searchParams() }
    const { data } = await config.api.list(params)
    if (config.tree) {
      rows.value = data as Row[]
    } else {
      const pr = data as PageResult<Row>
      rows.value = pr.list
      total.value = pr.total
    }
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  fetchData()
}

function onReset() {
  for (const key of Object.keys(searchForm)) {
    delete searchForm[key]
  }
  onSearch()
}

/** 暴露给页面：增/改/分配等动作完成后刷新（reset=true 回第一页） */
function reload(reset = false) {
  if (reset) {
    page.value = 1
  }
  fetchData()
}

defineExpose({ reload })

// ---- 视图模式（表格 / 卡片）：一份 config 驱动两种渲染，存 localStorage（全局默认）----
// 树形列表强制表格（层级缩进卡片化无意义）；切换不改任何单页 DOM、不影响生成器基线。
const STORAGE_VIEW = 'bx-list-view'
const viewMode = ref<'table' | 'card'>(localStorage.getItem(STORAGE_VIEW) === 'card' ? 'card' : 'table')
const effectiveView = computed<'table' | 'card'>(() => (config.tree ? 'table' : viewMode.value))
function setView(v: 'table' | 'card') {
  viewMode.value = v
  localStorage.setItem(STORAGE_VIEW, v)
}

// 卡片字段映射：主字段（name/title 优先，否则首个非 id 文本列）作标题，其余列作明细，操作沿用 rowActions
const titleCol = computed<ColumnItem | undefined>(() => {
  const cols = config.columns
  return (
    cols.find((c) => c.prop === 'name' || c.prop === 'title') ??
    cols.find((c) => (c.type ?? 'text') === 'text' && c.prop !== 'id') ??
    cols[0]
  )
})
const bodyCols = computed<ColumnItem[]>(() =>
  config.columns.filter((c) => c.prop !== titleCol.value?.prop && c.prop !== 'id'),
)
function cardTitle(row: Row): string {
  return String(row[titleCol.value?.prop ?? rowKey] ?? '')
}
function cardAvatar(row: Row): string {
  const t = cardTitle(row).trim()
  return t ? t.slice(0, 1).toUpperCase() : '#'
}

// ---- 状态开关（api.status；失败回滚行值）----
function canToggle(col: ColumnItem): boolean {
  return !!config.api.status && (!col.perm || userStore.hasPerm(col.perm))
}

async function onStatusChange(col: ColumnItem, row: Row, val: string | number | boolean) {
  if (!config.api.status) {
    return
  }
  const old = row[col.prop]
  row[col.prop] = val
  try {
    await config.api.status(Number(row[rowKey]), Number(val))
    ElMessage.success('状态更新成功')
  } catch {
    row[col.prop] = old // 业务失败（如 super_admin 不可停用）回滚；错误消息由拦截器统一弹出
  }
}

// ---- 操作列 ----
function rowText(row: Row): string {
  return String(row.name ?? row.title ?? row[rowKey] ?? '')
}

async function onAction(act: RowAction, row: Row) {
  if (act.confirm) {
    const text =
      typeof act.confirm === 'string' ? act.confirm : `确定${act.label}「${rowText(row)}」吗？`
    try {
      await ElMessageBox.confirm(text, '提示', { type: 'warning' })
    } catch {
      return
    }
  }
  // 删除为通用动作，XTable 内建：调 api.remove → 提示 → 刷新（末行删除回退页码）
  if (act.emit === 'remove' && config.api.remove) {
    try {
      await config.api.remove(Number(row[rowKey]))
      ElMessage.success('删除成功')
      if (!config.tree && rows.value.length === 1 && page.value > 1) {
        page.value--
      }
      fetchData()
    } catch {
      // 业务拒绝（如有子节点/有绑定 422）已由拦截器提示
    }
    return
  }
  emit('action', act.emit, row)
}

function searchWidth(it: SearchItem): string {
  return `${it.width ?? 200}px`
}

fetchData()
</script>

<template>
  <div>
    <!-- 搜索表单 -->
    <el-form
      v-if="config.search?.length"
      inline
      :model="searchForm"
      class="mb-2"
      @submit.prevent="onSearch"
    >
      <el-form-item v-for="it in config.search" :key="it.prop" :label="it.label">
        <el-input
          v-if="it.type === 'input'"
          v-model="searchForm[it.prop]"
          :placeholder="it.placeholder ?? `请输入${it.label}`"
          clearable
          :style="{ width: searchWidth(it) }"
          @keyup.enter="onSearch"
          @clear="onSearch"
        />
        <el-select
          v-else-if="it.type === 'select'"
          v-model="searchForm[it.prop]"
          :placeholder="it.placeholder ?? `请选择${it.label}`"
          clearable
          :style="{ width: searchWidth(it) }"
          @change="onSearch"
        >
          <el-option
            v-for="o in optionsOf(it)"
            :key="String(o.value)"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
        <el-date-picker
          v-else-if="it.type === 'daterange'"
          v-model="searchForm[it.prop]"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="onSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏：左新增 / 右「表格·卡片」视图切换（树形不提供卡片视图） -->
    <div
      v-if="config.toolbar?.create || !config.tree"
      class="mb-3 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <el-button
          v-if="config.toolbar?.create"
          v-permission="config.toolbar.create.perm"
          type="primary"
          @click="emit('action', 'create', null)"
        >
          {{ config.toolbar.create.label ?? '新增' }}
        </el-button>
        <!-- 额外工具栏按钮（手工槽：只读页清理 / 导出 / 退款等模块特化动作）-->
        <slot name="toolbar" />
      </div>
      <el-radio-group
        v-if="!config.tree"
        :model-value="effectiveView"
        @update:model-value="(v: string | number | boolean) => setView(v as 'table' | 'card')"
      >
        <el-radio-button value="table" title="表格视图">
          <el-icon><List /></el-icon>
        </el-radio-button>
        <el-radio-button value="card" title="卡片视图">
          <el-icon><Grid /></el-icon>
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 表格视图（平铺/树形共用；树形走 row-key + tree-props 缩进展开） -->
    <el-table
      v-if="effectiveView === 'table'"
      v-loading="loading"
      :data="rows"
      :row-key="rowKey"
      :default-expand-all="config.tree ? (config.defaultExpandAll ?? true) : false"
      :tree-props="{ children: config.childrenKey ?? 'children' }"
      border
      stripe
    >
      <el-table-column
        v-for="col in config.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :sortable="col.sortable ?? false"
        :align="col.align"
        :show-overflow-tooltip="col.showOverflowTooltip"
      >
        <template #default="{ row }">
          <template v-if="col.type === 'dictTag'">
            <el-tag v-if="matchOption(col, row)" :type="tagTypeOf(matchOption(col, row))" disable-transitions>
              {{ matchOption(col, row)!.label }}
            </el-tag>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
          <el-switch
            v-else-if="col.type === 'switch'"
            :model-value="row[col.prop]"
            :active-value="col.activeValue ?? 1"
            :inactive-value="col.inactiveValue ?? 0"
            :disabled="!canToggle(col)"
            @change="(v: string | number | boolean) => onStatusChange(col, row, v)"
          />
          <slot v-else-if="col.type === 'slot'" :name="col.slot ?? col.prop" :row="row" />
          <span v-else>{{ row[col.prop] }}</span>
        </template>
      </el-table-column>

      <el-table-column
        v-if="config.rowActions?.length"
        label="操作"
        fixed="right"
        :width="config.actionsWidth ?? 180"
        align="center"
      >
        <template #default="{ row }">
          <template v-for="act in config.rowActions" :key="act.emit">
            <el-button
              v-if="!act.show || act.show(row)"
              v-permission="act.perm"
              link
              :type="act.type ?? 'primary'"
              size="small"
              @click="onAction(act, row)"
            >
              {{ act.label }}
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 卡片视图（Bento 风：同一份 data 渲染为卡片网格，字段从 columns 推导） -->
    <div v-else v-loading="loading" class="bx-card-grid">
      <el-empty v-if="!rows.length" description="暂无数据" />
      <div v-for="row in rows" :key="String(row[rowKey])" class="bx-data-card">
        <div class="bx-data-card__head">
          <span class="bx-data-card__avatar">{{ cardAvatar(row) }}</span>
          <div class="bx-data-card__title-wrap">
            <div class="bx-data-card__title" :title="cardTitle(row)">{{ cardTitle(row) }}</div>
            <div v-if="row.id != null" class="bx-data-card__id">#{{ row.id }}</div>
          </div>
        </div>
        <div class="bx-data-card__body">
          <div v-for="col in bodyCols" :key="col.prop" class="bx-data-card__field">
            <span class="bx-data-card__label">{{ col.label }}</span>
            <span class="bx-data-card__value">
              <template v-if="col.type === 'dictTag'">
                <el-tag
                  v-if="matchOption(col, row)"
                  :type="tagTypeOf(matchOption(col, row))"
                  disable-transitions
                >
                  {{ matchOption(col, row)!.label }}
                </el-tag>
                <span v-else>{{ row[col.prop] }}</span>
              </template>
              <el-switch
                v-else-if="col.type === 'switch'"
                :model-value="row[col.prop]"
                :active-value="col.activeValue ?? 1"
                :inactive-value="col.inactiveValue ?? 0"
                :disabled="!canToggle(col)"
                @change="(v: string | number | boolean) => onStatusChange(col, row, v)"
              />
              <slot v-else-if="col.type === 'slot'" :name="col.slot ?? col.prop" :row="row" />
              <span v-else>{{ row[col.prop] }}</span>
            </span>
          </div>
        </div>
        <div v-if="config.rowActions?.length" class="bx-data-card__foot">
          <template v-for="act in config.rowActions" :key="act.emit">
            <el-button
              v-if="!act.show || act.show(row)"
              v-permission="act.perm"
              link
              :type="act.type ?? 'primary'"
              size="small"
              @click="onAction(act, row)"
            >
              {{ act.label }}
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 分页（树形无分页） -->
    <div v-if="!config.tree" class="mt-3 flex justify-end">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[15, 30, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchData"
        @size-change="onSearch"
      />
    </div>
  </div>
</template>

<style scoped>
/* —— 卡片视图（Bento 风网格，跟随主题 token）—— */
.bx-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.bx-card-grid .el-empty {
  grid-column: 1 / -1;
}
.bx-data-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: var(--bx-card-bg);
  border: 1px solid var(--bx-card-border);
  border-radius: var(--bx-card-radius);
  box-shadow: var(--bx-card-shadow);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.bx-data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
}
.bx-data-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bx-data-card__avatar {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  font-weight: 600;
  color: #fff;
  background: var(--bx-color-primary);
}
.bx-data-card__title-wrap {
  min-width: 0;
  flex: 1;
}
.bx-data-card__title {
  font-weight: 600;
  color: var(--bx-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bx-data-card__id {
  font-size: 12px;
  color: var(--bx-text-tertiary);
}
.bx-data-card__body {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bx-data-card__field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}
.bx-data-card__label {
  color: var(--bx-text-secondary);
  flex-shrink: 0;
}
.bx-data-card__value {
  color: var(--bx-text-primary);
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bx-data-card__foot {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--bx-border);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}
</style>
