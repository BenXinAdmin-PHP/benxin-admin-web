<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XTable 配置化表格（搜索 + 列表/树形 + 分页 + 工具栏 + 操作列 + v-permission）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-10
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

    <!-- 工具栏 -->
    <div v-if="config.toolbar?.create" class="mb-3">
      <el-button
        v-permission="config.toolbar.create.perm"
        type="primary"
        @click="emit('action', 'create', null)"
      >
        {{ config.toolbar.create.label ?? '新增' }}
      </el-button>
    </div>

    <!-- 表格（平铺/树形共用；树形走 row-key + tree-props 缩进展开） -->
    <el-table
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
