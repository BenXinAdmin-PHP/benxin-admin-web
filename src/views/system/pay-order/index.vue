<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   支付订单（只读列表 + 详情 + 退款；XTable 配置化 + 手工槽退款弹窗）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import XTable from '@/components/XTable/index.vue'
import XDetailDialog from '@/components/XDetailDialog/index.vue'
import type { DetailField } from '@/components/XDetailDialog/types'
import { listPayOrders, refundPayOrder } from '@/api/payOrder'
import type { Row, XTableConfig } from '@/components/XTable/types'

// status：0待支付 1已支付 2已退款 3部分退款 4已关闭 5支付失败
const STATUS_OPTIONS = [
  { label: '待支付', value: 0, tagType: 'info' },
  { label: '已支付', value: 1, tagType: 'success' },
  { label: '已退款', value: 2, tagType: 'warning' },
  { label: '部分退款', value: 3, tagType: 'warning' },
  { label: '已关闭', value: 4, tagType: 'info' },
  { label: '支付失败', value: 5, tagType: 'danger' },
]

/** 分 → 元（展示） */
function yuan(fen: unknown): string {
  return `¥${(Number(fen ?? 0) / 100).toFixed(2)}`
}

const config: XTableConfig = {
  api: { list: listPayOrders },
  rowKey: 'id',
  search: [
    { prop: 'order_no', label: '订单号', type: 'input' },
    { prop: 'channel', label: '渠道', type: 'input', width: 160 },
    { prop: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS, width: 150 },
    { prop: 'biz_type', label: '业务类型', type: 'input', width: 160 },
    { prop: 'created', label: '时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'order_no', label: '订单号', minWidth: 180, showOverflowTooltip: true },
    { prop: 'subject', label: '商品', minWidth: 140, showOverflowTooltip: true },
    { prop: 'amount', label: '金额', type: 'slot', width: 110, align: 'right' },
    { prop: 'channel', label: '渠道', width: 100 },
    { prop: 'status', label: '状态', type: 'dictTag', options: STATUS_OPTIONS, width: 100 },
    { prop: 'paid_at', label: '支付时间', type: 'time', width: 170 },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 170 },
  ],
  rowActions: [
    { label: '详情', emit: 'detail', perm: 'system:pay:list' },
    {
      label: '退款',
      emit: 'refund',
      perm: 'system:pay:refund',
      type: 'warning',
      // 仅已支付 / 部分退款可退
      show: (row) => row.status === 1 || row.status === 3,
    },
  ],
}

const detailFields: DetailField[] = [
  { prop: 'order_no', label: '订单号' },
  { prop: 'out_trade_no', label: '外部交易号' },
  { prop: 'transaction_id', label: '渠道交易号' },
  { prop: 'subject', label: '商品' },
  { prop: 'amount', label: '金额', formatter: (v) => yuan(v) },
  { prop: 'refunded_amount', label: '已退金额', formatter: (v) => yuan(v) },
  { prop: 'status', label: '状态', formatter: (v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? String(v) },
  { prop: 'channel', label: '渠道' },
  { prop: 'trade_type', label: '交易类型' },
  { prop: 'biz_type', label: '业务类型' },
  { prop: 'biz_id', label: '业务 ID' },
  { prop: 'paid_at', label: '支付时间' },
  { prop: 'created_at', label: '创建时间' },
]

const tableRef = ref<InstanceType<typeof XTable>>()
const detailVisible = ref(false)
const detailRow = ref<Row | null>(null)

// —— 退款弹窗 ——
const refundVisible = ref(false)
const refundLoading = ref(false)
const refundRow = ref<Row | null>(null)
const refundForm = reactive({ amount: 0, reason: '' })

function onAction(name: string, row: Row | null) {
  if (name === 'detail' && row) {
    detailRow.value = row
    detailVisible.value = true
  } else if (name === 'refund' && row) {
    refundRow.value = row
    // 默认可退金额 = 总额 - 已退（元）
    refundForm.amount = Number(((Number(row.amount) - Number(row.refunded_amount ?? 0)) / 100).toFixed(2))
    refundForm.reason = ''
    refundVisible.value = true
  }
}

async function submitRefund() {
  if (!refundRow.value) {
    return
  }
  const fen = Math.round(refundForm.amount * 100)
  if (fen <= 0) {
    ElMessage.warning('退款金额需大于 0')
    return
  }
  refundLoading.value = true
  try {
    await refundPayOrder(Number(refundRow.value.id), {
      amount: fen,
      reason: refundForm.reason,
      confirm: '1',
    })
    ElMessage.success('退款已提交')
    refundVisible.value = false
    tableRef.value?.reload()
  } catch {
    // 拦截器已提示（状态不允许 / 金额超限 等 422）
  } finally {
    refundLoading.value = false
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction">
      <template #amount="{ row }">{{ yuan(row.amount) }}</template>
    </XTable>
  </el-card>

  <XDetailDialog
    v-model="detailVisible"
    title="支付订单详情"
    :fields="detailFields"
    :data="detailRow"
    :width="640"
  />

  <el-dialog v-model="refundVisible" title="订单退款" width="440px">
    <el-form :model="refundForm" label-width="90px">
      <el-form-item label="订单号">
        <span class="text-[var(--bx-text-secondary)]">{{ refundRow?.order_no }}</span>
      </el-form-item>
      <el-form-item label="退款金额">
        <el-input-number v-model="refundForm.amount" :min="0.01" :precision="2" :step="1" />
        <span class="ml-2 text-12px text-[var(--bx-text-tertiary)]">元</span>
      </el-form-item>
      <el-form-item label="退款原因">
        <el-input v-model="refundForm.reason" type="textarea" placeholder="可空" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="refundVisible = false">取消</el-button>
      <el-button type="warning" :loading="refundLoading" @click="submitRefund">确认退款</el-button>
    </template>
  </el-dialog>
</template>
