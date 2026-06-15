<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   操作日志（只读列表 + 详情 + 清理；XTable 配置化 + 手工槽工具栏/详情）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import XTable from '@/components/XTable/index.vue'
import XDetailDialog from '@/components/XDetailDialog/index.vue'
import type { DetailField } from '@/components/XDetailDialog/types'
import { clearOperLogs, listOperLogs } from '@/api/operLog'
import type { Row, XTableConfig } from '@/components/XTable/types'

const config: XTableConfig = {
  api: { list: listOperLogs },
  rowKey: 'id',
  search: [
    { prop: 'username', label: '操作人', type: 'input' },
    { prop: 'path', label: '请求路径', type: 'input' },
    {
      prop: 'method',
      label: '方法',
      type: 'select',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      width: 140,
    },
    { prop: 'created', label: '时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'username', label: '操作人', width: 120 },
    {
      prop: 'method',
      label: '方法',
      type: 'dictTag',
      width: 90,
      options: [
        { label: 'GET', value: 'GET', tagType: 'info' },
        { label: 'POST', value: 'POST', tagType: 'success' },
        { label: 'PUT', value: 'PUT', tagType: 'warning' },
        { label: 'DELETE', value: 'DELETE', tagType: 'danger' },
      ],
    },
    { prop: 'path', label: '请求路径', minWidth: 200, showOverflowTooltip: true },
    { prop: 'http_status', label: 'HTTP', width: 80, align: 'center' },
    { prop: 'duration_ms', label: '耗时(ms)', width: 100, align: 'center' },
    { prop: 'ip', label: 'IP', width: 130 },
    { prop: 'created_at', label: '操作时间', type: 'time', sortable: true, width: 180 },
  ],
  rowActions: [{ label: '详情', emit: 'detail', perm: 'system:operlog:list' }],
}

const detailFields: DetailField[] = [
  { prop: 'username', label: '操作人' },
  { prop: 'method', label: '请求方法' },
  { prop: 'path', label: '请求路径' },
  { prop: 'perm', label: '权限标识' },
  { prop: 'http_status', label: 'HTTP 状态' },
  { prop: 'response_code', label: '业务码' },
  { prop: 'duration_ms', label: '耗时(ms)' },
  { prop: 'ip', label: 'IP' },
  { prop: 'request_id', label: '请求 ID' },
  { prop: 'created_at', label: '操作时间' },
  { prop: 'user_agent', label: 'User-Agent', span: 1 },
  { prop: 'request_body', label: '请求体', span: 1 },
]

const tableRef = ref<InstanceType<typeof XTable>>()
const detailVisible = ref(false)
const detailRow = ref<Row | null>(null)

function onAction(name: string, row: Row | null) {
  if (name === 'detail' && row) {
    detailRow.value = row
    detailVisible.value = true
  }
}

async function clearAll() {
  try {
    await ElMessageBox.confirm('确定清空全部操作日志？此操作不可恢复！', '危险操作', {
      type: 'warning',
      confirmButtonText: '确定清空',
    })
  } catch {
    return
  }
  try {
    const { data } = await clearOperLogs({ all: 1 })
    ElMessage.success(`已清理 ${data.deleted} 条`)
    tableRef.value?.reload(true)
  } catch {
    // 拦截器已提示
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction">
      <template #toolbar>
        <el-button v-permission="'system:operlog:delete'" type="danger" plain @click="clearAll">
          清理日志
        </el-button>
      </template>
    </XTable>
  </el-card>

  <XDetailDialog
    v-model="detailVisible"
    title="操作日志详情"
    :fields="detailFields"
    :data="detailRow"
    :width="640"
  />
</template>
