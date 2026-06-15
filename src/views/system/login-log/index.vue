<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   登录日志（只读列表 + 详情 + 清理；XTable 配置化 + 手工槽工具栏/详情）
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
import { clearLoginLogs, listLoginLogs } from '@/api/loginLog'
import type { Row, XTableConfig } from '@/components/XTable/types'

const STATUS_OPTIONS = [
  { label: '成功', value: 1, tagType: 'success' },
  { label: '失败', value: 0, tagType: 'danger' },
]

const config: XTableConfig = {
  api: { list: listLoginLogs },
  rowKey: 'id',
  search: [
    { prop: 'username', label: '账号', type: 'input' },
    { prop: 'status', label: '结果', type: 'select', options: STATUS_OPTIONS, width: 140 },
    { prop: 'created', label: '时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'username', label: '账号', width: 140 },
    { prop: 'status', label: '结果', type: 'dictTag', options: STATUS_OPTIONS, width: 90 },
    { prop: 'msg', label: '说明', minWidth: 180, showOverflowTooltip: true },
    { prop: 'ip', label: 'IP', width: 140 },
    { prop: 'created_at', label: '登录时间', type: 'time', sortable: true, width: 180 },
  ],
  rowActions: [{ label: '详情', emit: 'detail', perm: 'system:loginlog:list' }],
}

const detailFields: DetailField[] = [
  { prop: 'username', label: '账号' },
  { prop: 'status', label: '结果', formatter: (v) => (Number(v) === 1 ? '成功' : '失败') },
  { prop: 'msg', label: '说明' },
  { prop: 'ip', label: 'IP' },
  { prop: 'request_id', label: '请求 ID' },
  { prop: 'created_at', label: '登录时间' },
  { prop: 'user_agent', label: 'User-Agent' },
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
    await ElMessageBox.confirm('确定清空全部登录日志？此操作不可恢复！', '危险操作', {
      type: 'warning',
      confirmButtonText: '确定清空',
    })
  } catch {
    return
  }
  try {
    const { data } = await clearLoginLogs({ all: 1 })
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
        <el-button v-permission="'system:loginlog:delete'" type="danger" plain @click="clearAll">
          清理日志
        </el-button>
      </template>
    </XTable>
  </el-card>

  <XDetailDialog
    v-model="detailVisible"
    title="登录日志详情"
    :fields="detailFields"
    :data="detailRow"
  />
</template>
