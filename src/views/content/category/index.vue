<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   内容分类管理（bx:make 生成：树形 XTable 整树无分页 + 编辑抽屉）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import {
  createContentCategory,
  deleteContentCategory,
  getContentCategoryTree,
  setContentCategoryStatus,
  updateContentCategory,
} from '@/api/contentCategory'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'


const api = {
  list: getContentCategoryTree,
  save: createContentCategory,
  update: updateContentCategory,
  remove: deleteContentCategory,
  status: setContentCategoryStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  // ★ 树形范式：取 GET content-categories/tree 整树、无分页，row-key + tree-props 缩进展开
  tree: true,
  defaultExpandAll: true,
  columns: [
    { prop: 'name', label: '分类名称', minWidth: 180 },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
    { prop: 'status', label: '状态', type: 'switch', perm: 'content:category:update', width: 80 },
  ],
  toolbar: { create: { perm: 'content:category:create', label: '新增内容分类' } },
  rowActions: [
    { label: '新增下级', emit: 'addChild', perm: 'content:category:create' },
    { label: '编辑', emit: 'edit', perm: 'content:category:update' },
    {
      label: '删除',
      emit: 'remove',
      perm: 'content:category:delete',
      type: 'danger',
      confirm: true, // 有子节点后端拒删 422
    },
  ],
}

/** 父级内容分类树：虚拟根「顶级」(id=0) */
async function parentTreeData(): Promise<Row[]> {
  const { data } = await getContentCategoryTree()
  return [{ id: 0, name: '顶级', children: data }]
}

const formConfig: XFormDrawerConfig = {
  entity: '内容分类',
  api,
  items: [
    {
      prop: 'parent_id',
      label: '父级内容分类',
      type: 'treeSelect',
      checkStrictly: true,
      treeData: parentTreeData,
      defaultValue: 0,
    },
    { prop: 'name', label: '分类名称', type: 'input', required: true },
    { prop: 'icon', label: '图标', type: 'input', tip: 'Element Plus Icons 图标名，可空' },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'addChild' && row) {
    // 行内「新增下级」：预置 parent_id 的 create 场景
    drawerRef.value?.open('create', { parent_id: row.id })
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
