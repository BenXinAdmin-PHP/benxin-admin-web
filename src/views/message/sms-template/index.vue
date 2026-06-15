<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   短信模板管理（bx:make 生成：XTable 配置化列表 + 编辑抽屉）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-13
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import {
  createSmsTemplate,
  deleteSmsTemplate,
  listSmsTemplates,
  setSmsTemplateStatus,
  updateSmsTemplate,
} from '@/api/smsTemplate'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'


const api = {
  list: listSmsTemplates,
  save: createSmsTemplate,
  update: updateSmsTemplate,
  remove: deleteSmsTemplate,
  status: setSmsTemplateStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '场景标识查询' },
    { prop: 'channel', label: '渠道', type: 'input' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'scene', label: '场景标识', width: 140 },
    { prop: 'channel', label: '渠道', type: 'dictTag', dict: 'sys_sms_channel', width: 100 },
    { prop: 'template_code', label: '模板ID', width: 180 },
    { prop: 'sign_name', label: '签名', width: 120 },
    { prop: 'status', label: '状态', type: 'dictTag', dict: 'sys_normal_disable', width: 90 },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:sms:template:create', label: '新增短信模板' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:sms:template:update' },
    { label: '删除', emit: 'remove', perm: 'system:sms:template:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '短信模板',
  api,
  items: [
    { prop: 'scene', label: '场景标识', type: 'input', required: true, disabledOnEdit: true },
    {
      prop: 'channel',
      label: '渠道',
      type: 'select',
      dict: 'sys_sms_channel',
      required: true,
      defaultValue: 'ali',
    },
    { prop: 'template_code', label: '模板ID', type: 'input', required: true, tip: '渠道侧审核通过后的模板 ID' },
    { prop: 'sign_name', label: '签名', type: 'input', tip: '可空，留空则用渠道默认签名' },
    { prop: 'content', label: '内容参考', type: 'textarea', tip: '内容/参数说明，仅参考，实际以渠道模板为准' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', defaultValue: 1 },
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
