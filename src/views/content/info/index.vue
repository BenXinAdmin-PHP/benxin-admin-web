<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   内容管理（bx:make 生成：XTable 配置化列表 + 编辑抽屉）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  | @updated   2026-06-12（手工槽接线：category_id treeSelect/搜索 select + cover XUpload + content XEditor）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import XUpload from '@/components/XUpload/index.vue'
import XEditor from '@/components/XEditor/index.vue'
import {
  createContent,
  deleteContent,
  listContents,
  setContentStatus,
  updateContent,
} from '@/api/content'
import { getContentCategoryTree, type ContentCategoryItem } from '@/api/contentCategory'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

// ---- ★ 手工槽（生成器缺口·跨模块数据源）：分类树平铺为搜索下拉选项（缩进表层级）----
const categoryOptions = reactive<OptionItem[]>([])
function flattenCategories(nodes: ContentCategoryItem[], depth = 0) {
  for (const n of nodes) {
    categoryOptions.push({ label: `${'　'.repeat(depth)}${n.name}`, value: n.id })
    if (n.children?.length) {
      flattenCategories(n.children, depth + 1)
    }
  }
}
getContentCategoryTree().then(({ data }) => flattenCategories(data))


const api = {
  list: listContents,
  save: createContent,
  update: updateContent,
  remove: deleteContent,
  status: setContentStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '标题模糊查询' },
    // ★ 手工槽：分类下拉（生成器对非字典 exact 字段默认 input，远程选项不可声明·缺口）
    { prop: 'category_id', label: '所属分类', type: 'select', options: categoryOptions, width: 180 },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_content_status', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true },
    { prop: 'status', label: '状态', type: 'dictTag', dict: 'sys_content_status', width: 90 },
    { prop: 'is_top', label: '置顶', type: 'dictTag', dict: 'sys_yes_no', width: 70, align: 'center' },
    { prop: 'author', label: '作者', width: 100 },
    { prop: 'view_count', label: '浏览量', width: 90, align: 'center' },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
    { prop: 'publish_at', label: '发布时间', type: 'time', width: 170 },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'content:info:create', label: '新增内容' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'content:info:update' },
    { label: '删除', emit: 'remove', perm: 'content:info:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '内容',
  // 富文本编辑需要更宽的工作区
  width: 760,
  api,
  items: [
    { prop: 'title', label: '标题', type: 'input', required: true },
    // ★ 手工槽（生成器缺口·跨模块数据源）：分类树 treeSelect，必填
    {
      prop: 'category_id',
      label: '所属分类',
      type: 'treeSelect',
      required: true,
      requiredMessage: '请选择所属分类',
      treeData: async () => (await getContentCategoryTree()).data,
      treeProps: { label: 'name' },
    },
    // ★ 手工槽（生成器缺口·回炉候选 image:true）：封面图 XUpload 单图，可空
    { prop: 'cover', label: '封面图', type: 'slot' },
    { prop: 'summary', label: '摘要', type: 'textarea' },
    // ★ 手工槽（生成器缺口·回炉候选 richtext:true）：正文 XEditor，必填；后端 HtmlPurifier 二次净化
    { prop: 'content', label: '正文', type: 'slot', required: true, requiredMessage: '请输入正文' },
    { prop: 'author', label: '作者', type: 'input' },
    { prop: 'source', label: '来源', type: 'input' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_content_status', defaultValue: 0 },
    { prop: 'is_top', label: '置顶', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'publish_at', label: '发布时间', type: 'datetime', tip: '可空；为空表示未定发布时间' },
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

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()">
    <!-- ★ 手工槽：封面图上传（XUpload 单图，消费 M2-D 文件通道） -->
    <template #cover="{ form, disabled }">
      <XUpload v-model="form.cover" :disabled="disabled" />
    </template>
    <!-- ★ 手工槽：富文本正文（XEditor/wangEditor v5；后端 HtmlPurifier 白名单兜底） -->
    <template #content="{ form, disabled }">
      <XEditor v-model="form.content" :disabled="disabled" />
    </template>
  </XFormDrawer>
</template>
