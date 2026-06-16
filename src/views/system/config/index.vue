<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   参数配置（标准 CRUD + 手工槽：敏感脱敏 **** 占位保留原值；顶栏 Tab 按 group 分类）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  | @updated   2026-06-16（顶栏 el-tabs 按 group 分类：[全部]+站点/存储/微信/支付/短信，切 Tab 筛选、关键词 Tab 内搜、新增预填当前组）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import {
  createConfig,
  deleteConfig,
  getConfig,
  listConfigGroups,
  listConfigs,
  updateConfig,
} from '@/api/config'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

// ---- 顶栏 Tab：group 中文名 + 顺序前端写死映射（v1，未映射兜底显原始名）----
const CONFIG_GROUP_LABELS: Record<string, string> = {
  site: '站点',
  storage: '存储',
  wechat: '微信',
  pay: '支付',
  sms: '短信',
  // 未来新 group 在此补；未映射的 group 用原始 group 名兜底显示
}
const CONFIG_GROUP_ORDER = ['site', 'storage', 'wechat', 'pay', 'sms']

const ALL_TAB = '__all__'
/** 当前选中 Tab（__all__ = 全部）；currentGroup 为注入 list 的实际 group（全部时为空串） */
const activeTab = ref<string>(ALL_TAB)
const currentGroup = computed(() => (activeTab.value === ALL_TAB ? '' : activeTab.value))

interface GroupTab {
  group: string
  label: string
  count: number
}
const groupTabs = ref<GroupTab[]>([])
const totalCount = computed(() => groupTabs.value.reduce((sum, t) => sum + t.count, 0))

/** 拉取实际 group 列表 → 按写死顺序排序（未在 order 里的追加末尾、显原始名）*/
async function loadGroups() {
  const { data } = await listConfigGroups()
  const ordered = [...data].sort((a, b) => {
    const ia = CONFIG_GROUP_ORDER.indexOf(a.group)
    const ib = CONFIG_GROUP_ORDER.indexOf(b.group)
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib)
  })
  groupTabs.value = ordered.map((g) => ({
    group: g.group,
    label: CONFIG_GROUP_LABELS[g.group] ?? g.group,
    count: g.count,
  }))
}
onMounted(loadGroups)

// 列表 api 包装：调用时注入当前 Tab 的 group（全部时不传，后端返回全部）。
// XTable 每次 fetch 都新调 api.list，故切 Tab + reload 即按新 group 筛选，无需改 XTable。
const wrappedList = (params: Record<string, unknown>) =>
  listConfigs({ ...params, ...(currentGroup.value ? { group: currentGroup.value } : {}) })

const api = {
  list: wrappedList,
  save: createConfig,
  update: updateConfig,
  remove: deleteConfig,
}

const SENSITIVE_OPTIONS: OptionItem[] = [
  { label: '普通', value: 0, tagType: 'info' },
  { label: '敏感', value: 1, tagType: 'danger' },
]

const config: XTableConfig = {
  api,
  rowKey: 'id',
  // 分组筛选已移到顶栏 Tab，搜索区仅保留关键词（在当前 Tab 范围内搜）
  search: [{ prop: 'keyword', label: '关键词', type: 'input', placeholder: '名称/键' }],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'name', label: '配置名称', width: 150 },
    { prop: 'group', label: '分组', width: 120 },
    { prop: 'key', label: '配置键', width: 180, showOverflowTooltip: true },
    { prop: 'value', label: '配置值', minWidth: 180, showOverflowTooltip: true },
    { prop: 'is_sensitive', label: '敏感', type: 'dictTag', options: SENSITIVE_OPTIONS, width: 90 },
    { prop: 'value_type', label: '值类型', width: 100 },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
  ],
  toolbar: { create: { perm: 'system:config:create', label: '新增配置' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:config:update' },
    { label: '删除', emit: 'remove', perm: 'system:config:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '参数配置',
  api,
  // 编辑回显走 detail（与列表一致脱敏，敏感值为 ****）
  detail: getConfig,
  items: [
    { prop: 'name', label: '配置名称', type: 'input', required: true },
    { prop: 'group', label: '分组', type: 'input', required: true, disabledOnEdit: true },
    { prop: 'key', label: '配置键', type: 'input', required: true, disabledOnEdit: true },
    {
      prop: 'value',
      label: '配置值',
      type: 'textarea',
      tip: '敏感项回显为 ****；如不修改请保留 **** 占位，后端将沿用原值。',
    },
    { prop: 'value_type', label: '值类型', type: 'input', tip: '如 string / int / bool / json' },
    { prop: 'is_sensitive', label: '敏感项', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

/** 切 Tab：按新 group 重新筛选（回第 1 页）并刷新计数 */
function onTabChange() {
  tableRef.value?.reload(true)
  loadGroups()
}

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    // 新增时预填当前 Tab 的 group（全部 Tab 不预填，由用户选择）
    drawerRef.value?.open('create', currentGroup.value ? { group: currentGroup.value } : undefined)
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  }
}

/** 增/改成功后刷新当前 Tab 列表 + 分组计数 */
function onSaved() {
  tableRef.value?.reload()
  loadGroups()
}
</script>

<template>
  <el-card shadow="never">
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane :label="`全部 (${totalCount})`" :name="ALL_TAB" />
      <el-tab-pane
        v-for="t in groupTabs"
        :key="t.group"
        :name="t.group"
        :label="`${t.label} (${t.count})`"
      />
    </el-tabs>
    <XTable ref="tableRef" :config="config" @action="onAction" />
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="onSaved" />
</template>
