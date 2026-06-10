<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   角色管理（黄金样板：XTable 配置化列表 + 编辑抽屉 + 分配菜单弹窗 + data_scope 五档）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-10
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import AssignMenuDialog from './AssignMenuDialog.vue'
import {
  assignRoleMenus,
  createRole,
  deleteRole,
  getRole,
  getRoleMenuIds,
  listRoles,
  setRoleStatus,
  updateRole,
} from '@/api/role'
import { getDeptTree } from '@/api/dept'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

const SUPER_CODE = 'super_admin'

/** 数据范围五档（ADR-9；模块特化的静态枚举，不走字典） */
const DATA_SCOPE_OPTIONS: OptionItem[] = [
  { label: '全部数据', value: 1, tagType: 'danger' },
  { label: '本部门', value: 2, tagType: 'warning' },
  { label: '本部门及以下', value: 3, tagType: 'warning' },
  { label: '仅本人', value: 4, tagType: 'info' },
  { label: '自定义', value: 5, tagType: 'primary' },
]

// 模块 API 槽位：列表/新增/更新/删除/状态 + 分配关系（relationEndpoints），
// D1 生成器即按后端元数据产出这份装配。
const api = {
  list: listRoles,
  save: createRole,
  update: updateRole,
  remove: deleteRole,
  status: setRoleStatus,
  relation: { read: getRoleMenuIds, write: assignRoleMenus },
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '名称/标识模糊查询' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'name', label: '角色名称', minWidth: 120 },
    { prop: 'code', label: '角色标识', minWidth: 130 },
    { prop: 'data_scope', label: '数据范围', type: 'dictTag', options: DATA_SCOPE_OPTIONS, width: 120 },
    { prop: 'status', label: '状态', type: 'switch', perm: 'system:role:update', width: 80 },
    { prop: 'sort', label: '排序', width: 70 },
    { prop: 'remark', label: '备注', minWidth: 140, showOverflowTooltip: true },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:role:create', label: '新增角色' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:role:update' },
    {
      label: '分配菜单',
      emit: 'assign',
      perm: 'system:role:update',
      // super_admin 由通配策略承载，后端拒绝分配（422），前端直接隐藏入口
      show: (row) => row.code !== SUPER_CODE,
    },
    {
      label: '删除',
      emit: 'remove',
      perm: 'system:role:delete',
      type: 'danger',
      confirm: true,
      show: (row) => row.code !== SUPER_CODE,
    },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '角色',
  api,
  // 编辑回显走 detail 聚合：行数据没有 dept_ids（data_scope=5 回显需要）
  detail: getRole,
  items: [
    { prop: 'name', label: '角色名称', type: 'input', required: true },
    {
      prop: 'code',
      label: '角色标识',
      type: 'input',
      required: true,
      disabledOnEdit: true,
      tip: 'Casbin subject，唯一且创建后不可改；软删后该值不可复用',
    },
    { prop: 'data_scope', label: '数据范围', type: 'select', options: DATA_SCOPE_OPTIONS, defaultValue: 1 },
    {
      // ★ 进阶范式（模块特化，ADR-9）：data_scope=5 自定义时展开部门树多选，
      // 并入 PUT roles/:id { data_scope, dept_ids }。后端 sceneCreate 不收 dept_ids，
      // 故仅编辑场景可见（新增选 5 后保存，再编辑配部门）。
      prop: 'dept_ids',
      label: '自定义部门',
      type: 'treeSelect',
      multiple: true,
      checkStrictly: true,
      treeData: async () => (await getDeptTree()).data,
      treeProps: { label: 'name' },
      visible: (form, mode) => mode === 'update' && Number(form.data_scope) === 5,
      tip: '独立勾选，提交精确部门 id 集合',
    },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

const assignVisible = ref(false)
const assignRoleId = ref(0)
const assignRoleName = ref('')

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  } else if (name === 'assign' && row) {
    assignRoleId.value = Number(row.id)
    assignRoleName.value = String(row.name)
    assignVisible.value = true
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction" />
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()" />

  <AssignMenuDialog v-model="assignVisible" :role-id="assignRoleId" :role-name="assignRoleName" />
</template>
