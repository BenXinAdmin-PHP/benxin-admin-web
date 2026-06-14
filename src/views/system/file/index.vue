<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   文件管理（列表 + 手工槽：上传/图片预览/受控下载/删除；非标准 CRUD）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import XTable from '@/components/XTable/index.vue'
import AuthImg from '@/components/XUpload/AuthImg.vue'
import {
  deleteFile,
  listFiles,
  releaseBlobUrl,
  resolvePreviewUrl,
  uploadFile,
} from '@/api/file'
import type { Row, XTableConfig } from '@/components/XTable/types'

const config: XTableConfig = {
  api: { list: listFiles, remove: deleteFile },
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '文件名' },
    { prop: 'ext', label: '扩展名', type: 'input', width: 140 },
    { prop: 'created', label: '上传时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'preview', label: '预览', type: 'slot', width: 100, align: 'center' },
    { prop: 'original_name', label: '文件名', minWidth: 180, showOverflowTooltip: true },
    { prop: 'ext', label: '类型', width: 90 },
    { prop: 'size', label: '大小', type: 'slot', width: 110, align: 'right' },
    { prop: 'storage', label: '驱动', width: 100 },
    { prop: 'created_at', label: '上传时间', type: 'time', sortable: true, width: 180 },
  ],
  rowActions: [
    { label: '下载', emit: 'download', perm: 'system:file:list' },
    { label: '删除', emit: 'remove', perm: 'system:file:delete', type: 'danger', confirm: true },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()

function isImage(row: Row): boolean {
  return String(row.mime ?? '').startsWith('image/')
}

/** 字节 → 人类可读 */
function humanSize(bytes: unknown): string {
  let n = Number(bytes ?? 0)
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 自定义上传（el-upload http-request 钩子，复用 M2-D 文件通道） */
async function customUpload(opt: { file: File }) {
  try {
    await uploadFile(opt.file)
    ElMessage.success('上传成功')
    tableRef.value?.reload(true)
  } catch {
    // 拦截器已提示（MIME/扩展名/大小校验失败等）
  }
}

/** 受控下载：取流为 blob 后触发浏览器下载（本地驱动需鉴权，不能直链） */
async function onAction(name: string, row: Row | null) {
  if (name === 'download' && row) {
    try {
      const blobUrl = await resolvePreviewUrl(String(row.url))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = String(row.original_name || row.file_name || 'download')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      releaseBlobUrl(blobUrl)
    } catch {
      ElMessage.error('下载失败')
    }
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction">
      <!-- 手工槽：上传入口 -->
      <template #toolbar>
        <el-upload
          v-permission="'system:file:upload'"
          :show-file-list="false"
          :http-request="customUpload"
        >
          <el-button type="primary" :icon="UploadFilled">上传文件</el-button>
        </el-upload>
      </template>
      <!-- 手工槽：图片预览（受控取流），非图片显示扩展名占位 -->
      <template #preview="{ row }">
        <AuthImg v-if="isImage(row)" :src="row.url" :height="40" />
        <span v-else class="text-12px text-[var(--bx-text-tertiary)]">{{ row.ext || '—' }}</span>
      </template>
      <!-- 手工槽：大小人类可读 -->
      <template #size="{ row }">{{ humanSize(row.size) }}</template>
    </XTable>
  </el-card>
</template>
