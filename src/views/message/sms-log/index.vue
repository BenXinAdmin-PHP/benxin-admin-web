<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   短信日志（只读列表 + 详情；XTable 配置化 + 手工槽详情）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XDetailDialog from '@/components/XDetailDialog/index.vue'
import type { DetailField } from '@/components/XDetailDialog/types'
import { listSmsLogs } from '@/api/smsLog'
import type { Row, XTableConfig } from '@/components/XTable/types'

const STATUS_OPTIONS = [
  { label: '成功', value: 1, tagType: 'success' },
  { label: '失败', value: 0, tagType: 'danger' },
]

const config: XTableConfig = {
  api: { list: listSmsLogs },
  rowKey: 'id',
  search: [
    { prop: 'mobile', label: '手机号', type: 'input' },
    { prop: 'scene', label: '场景', type: 'input' },
    { prop: 'status', label: '结果', type: 'select', options: STATUS_OPTIONS, width: 140 },
    { prop: 'created', label: '时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'mobile', label: '手机号', width: 130 },
    { prop: 'channel', label: '通道', width: 100 },
    { prop: 'scene', label: '场景', width: 120 },
    { prop: 'template_code', label: '模板', minWidth: 140, showOverflowTooltip: true },
    { prop: 'status', label: '结果', type: 'dictTag', options: STATUS_OPTIONS, width: 90 },
    { prop: 'created_at', label: '发送时间', type: 'time', sortable: true, width: 180 },
  ],
  rowActions: [{ label: '详情', emit: 'detail', perm: 'system:sms:log:list' }],
}

const detailFields: DetailField[] = [
  { prop: 'mobile', label: '手机号' },
  { prop: 'channel', label: '通道' },
  { prop: 'scene', label: '场景' },
  { prop: 'template_code', label: '模板编码' },
  { prop: 'status', label: '结果', formatter: (v) => (Number(v) === 1 ? '成功' : '失败') },
  { prop: 'ip', label: 'IP' },
  { prop: 'request_id', label: '请求 ID' },
  { prop: 'created_at', label: '发送时间' },
  { prop: 'params', label: '模板参数' },
  { prop: 'response', label: '网关响应' },
]

const detailVisible = ref(false)
const detailRow = ref<Row | null>(null)

function onAction(name: string, row: Row | null) {
  if (name === 'detail' && row) {
    detailRow.value = row
    detailVisible.value = true
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable :config="config" @action="onAction" />
  </el-card>

  <XDetailDialog v-model="detailVisible" title="短信日志详情" :fields="detailFields" :data="detailRow" />
</template>
