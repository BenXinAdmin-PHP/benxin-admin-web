<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   参数配置（标准 CRUD + 手工槽：敏感字段脱敏提示，**** 占位保留原值）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import { createConfig, deleteConfig, getConfig, listConfigs, updateConfig } from '@/api/config'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

const api = {
  list: listConfigs,
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
  search: [
    { prop: 'group', label: '分组', type: 'input', width: 160 },
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '名称/键' },
  ],
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

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction" />
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()" />
</template>
