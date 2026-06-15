<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   字典管理（类型 CRUD + 手工槽：数据项两级联动对话框 CRUD）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import {
  createDict,
  createDictData,
  deleteDict,
  deleteDictData,
  listDictData,
  listDicts,
  setDictDataStatus,
  setDictStatus,
  updateDict,
  updateDictData,
} from '@/api/dict'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

/* ---------------- 字典类型（主表，标准 CRUD） ---------------- */
const typeApi = {
  list: listDicts,
  save: createDict,
  update: updateDict,
  remove: deleteDict,
  status: setDictStatus,
}

const typeConfig: XTableConfig = {
  api: typeApi,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '字典名称/类型标识' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'name', label: '字典名称' },
    { prop: 'type', label: '类型标识' },
    { prop: 'status', label: '状态', type: 'switch', perm: 'system:dict:update', width: 80 },
    { prop: 'remark', label: '备注', showOverflowTooltip: true },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:dict:create', label: '新增字典类型' } },
  rowActions: [
    { label: '数据项', emit: 'data', perm: 'system:dict:list' },
    { label: '编辑', emit: 'edit', perm: 'system:dict:update' },
    { label: '删除', emit: 'remove', perm: 'system:dict:delete', type: 'danger', confirm: true },
  ],
}

const typeForm: XFormDrawerConfig = {
  entity: '字典类型',
  api: typeApi,
  items: [
    { prop: 'name', label: '字典名称', type: 'input', required: true },
    { prop: 'type', label: '类型标识', type: 'input', required: true, disabledOnEdit: true },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const typeTableRef = ref<InstanceType<typeof XTable>>()
const typeDrawerRef = ref<InstanceType<typeof XFormDrawer>>()

/* ---------------- 字典数据项（两级联动，对话框内 CRUD） ---------------- */
const dataVisible = ref(false)
const currentType = ref('')
const currentName = ref('')

const LIST_CLASS_OPTIONS: OptionItem[] = [
  { label: '默认', value: '' },
  { label: '成功(success)', value: 'success' },
  { label: '信息(info)', value: 'info' },
  { label: '警告(warning)', value: 'warning' },
  { label: '危险(danger)', value: 'danger' },
  { label: '主要(primary)', value: 'primary' },
]

// dict_type 自动注入到 list / save（免去表单隐藏字段）
const dataApi = {
  list: (params: Record<string, unknown>) =>
    listDictData({ ...params, dict_type: currentType.value }),
  save: (data: Record<string, unknown>) =>
    createDictData({ ...data, dict_type: currentType.value }),
  update: updateDictData,
  remove: deleteDictData,
  status: setDictDataStatus,
}

const dataConfig: XTableConfig = {
  api: dataApi,
  rowKey: 'id',
  search: [{ prop: 'keyword', label: '关键词', type: 'input', placeholder: '标签/键值' }],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'label', label: '标签' },
    { prop: 'value', label: '键值' },
    { prop: 'list_class', label: '样式', type: 'dictTag', options: LIST_CLASS_OPTIONS, width: 120 },
    { prop: 'sort', label: '排序', width: 80, align: 'center' },
    { prop: 'status', label: '状态', type: 'switch', perm: 'system:dict:update', width: 80 },
  ],
  toolbar: { create: { perm: 'system:dict:create', label: '新增数据项' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:dict:update' },
    { label: '删除', emit: 'remove', perm: 'system:dict:delete', type: 'danger', confirm: true },
  ],
}

const dataForm: XFormDrawerConfig = {
  entity: '字典数据项',
  api: dataApi,
  items: [
    { prop: 'label', label: '标签', type: 'input', required: true },
    { prop: 'value', label: '键值', type: 'input', required: true },
    { prop: 'list_class', label: '标签样式', type: 'select', options: LIST_CLASS_OPTIONS, defaultValue: '' },
    { prop: 'is_default', label: '默认项', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const dataTableRef = ref<InstanceType<typeof XTable>>()
const dataDrawerRef = ref<InstanceType<typeof XFormDrawer>>()

function onTypeAction(name: string, row: Row | null) {
  if (name === 'create') {
    typeDrawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    typeDrawerRef.value?.open('update', row)
  } else if (name === 'data' && row) {
    currentType.value = String(row.type)
    currentName.value = String(row.name)
    dataVisible.value = true
  }
}

function onDataAction(name: string, row: Row | null) {
  if (name === 'create') {
    dataDrawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    dataDrawerRef.value?.open('update', row)
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="typeTableRef" :config="typeConfig" @action="onTypeAction" />
  </el-card>

  <XFormDrawer ref="typeDrawerRef" :config="typeForm" @success="typeTableRef?.reload()" />

  <!-- 两级联动：数据项管理对话框（按字典类型过滤，:key 随类型重挂刷新） -->
  <el-dialog v-model="dataVisible" :title="`数据项 —— ${currentName}（${currentType}）`" width="860px" top="6vh">
    <XTable
      v-if="dataVisible"
      :key="currentType"
      ref="dataTableRef"
      :config="dataConfig"
      @action="onDataAction"
    />
    <XFormDrawer ref="dataDrawerRef" :config="dataForm" @success="dataTableRef?.reload()" />
  </el-dialog>
</template>
