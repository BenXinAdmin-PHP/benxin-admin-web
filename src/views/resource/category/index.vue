<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   素材分类管理（树形 XTable 整树无分页 + 编辑抽屉，复刻 dept/menu 树形范式）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-15
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import {
  createResourceCategory,
  deleteResourceCategory,
  getResourceCategoryTree,
  setResourceCategoryStatus,
  updateResourceCategory,
} from '@/api/resourceCategory'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

const api = {
  list: getResourceCategoryTree,
  save: createResourceCategory,
  update: updateResourceCategory,
  remove: deleteResourceCategory,
  status: setResourceCategoryStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  // ★ 树形范式：取整树、无分页，row-key + tree-props 缩进展开
  tree: true,
  defaultExpandAll: true,
  columns: [
    { prop: 'name', label: '分类名称', minWidth: 180 },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
    {
      prop: 'status',
      label: '状态',
      type: 'switch',
      perm: 'system:resource:category:update',
      width: 80,
    },
  ],
  toolbar: { create: { perm: 'system:resource:category:create', label: '新增素材分类' } },
  rowActions: [
    { label: '新增下级', emit: 'addChild', perm: 'system:resource:category:create' },
    { label: '编辑', emit: 'edit', perm: 'system:resource:category:update' },
    {
      label: '删除',
      emit: 'remove',
      perm: 'system:resource:category:delete',
      type: 'danger',
      confirm: true, // 有子节点 / 有素材绑定 后端拒删 422
    },
  ],
}

/** 父级素材分类树：虚拟根「顶级」(id=0)；treeProps label=name（category 节点字段为 name） */
async function parentTreeData(): Promise<Row[]> {
  const { data } = await getResourceCategoryTree()
  return [{ id: 0, name: '顶级', children: data }]
}

const formConfig: XFormDrawerConfig = {
  entity: '素材分类',
  api,
  items: [
    {
      prop: 'parent_id',
      label: '父级素材分类',
      type: 'treeSelect',
      treeProps: { label: 'name' },
      checkStrictly: true,
      treeData: parentTreeData,
      defaultValue: 0,
    },
    { prop: 'name', label: '分类名称', type: 'input', required: true },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'addChild' && row) {
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
