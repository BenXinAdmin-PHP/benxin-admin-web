<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   系统公告管理（bx:make 生成：XTable 配置化列表 + 编辑抽屉）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-13
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import XEditor from '@/components/XEditor/index.vue'
import {
  createNotice,
  deleteNotice,
  listNotices,
  setNoticeStatus,
  updateNotice,
} from '@/api/notice'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'


const api = {
  list: listNotices,
  save: createNotice,
  update: updateNotice,
  remove: deleteNotice,
  status: setNoticeStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '标题模糊查询' },
    { prop: 'type', label: '类型', type: 'input' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_content_status', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true },
    { prop: 'type', label: '类型', type: 'dictTag', dict: 'sys_notice_type', width: 90 },
    { prop: 'status', label: '状态', type: 'dictTag', dict: 'sys_content_status', width: 90 },
    { prop: 'is_top', label: '置顶', type: 'dictTag', dict: 'sys_yes_no', width: 70, align: 'center' },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
    { prop: 'publish_at', label: '发布时间', type: 'time', width: 170 },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:notice:create', label: '新增系统公告' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:notice:update' },
    { label: '删除', emit: 'remove', perm: 'system:notice:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '系统公告',
  // 富文本编辑需要更宽的工作区
  width: 760,
  api,
  items: [
    { prop: 'title', label: '标题', type: 'input', required: true },
    { prop: 'type', label: '类型', type: 'select', dict: 'sys_notice_type', required: true, defaultValue: 1 },
    // ★ richtext 槽（config richtext: true）：正文 XEditor，必填时对接 sceneCreate；后端 HtmlPurifier 二次净化
    { prop: 'content', label: '正文', type: 'slot', required: true, requiredMessage: '请输入正文' },
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
    <!-- ★ richtext 槽：富文本正文（XEditor/wangEditor v5；后端 HtmlPurifier 白名单兜底） -->
    <template #content="{ form, disabled }">
      <XEditor v-model="form.content" :disabled="disabled" />
    </template>
  </XFormDrawer>
</template>
