<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   只读详情对话框（el-descriptions 渲染字段，供日志/订单等只读模块复用）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import type { Row } from '@/components/XTable/types'
import type { DetailField } from './types'

const props = withDefaults(
  defineProps<{
    title?: string
    fields: DetailField[]
    data: Row | null
    width?: string | number
    column?: number
  }>(),
  { title: '详情', width: 560, column: 1 },
)

const visible = defineModel<boolean>({ required: true })

function render(f: DetailField): string {
  const val = props.data?.[f.prop]
  if (f.formatter) {
    return f.formatter(val, props.data ?? {})
  }
  return val === null || val === undefined || val === '' ? '—' : String(val)
}
</script>

<template>
  <el-dialog v-model="visible" :title="title" :width="width">
    <el-descriptions :column="column" border>
      <el-descriptions-item
        v-for="f in fields"
        :key="f.prop"
        :label="f.label"
        :span="f.span ?? 1"
      >
        {{ render(f) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>
