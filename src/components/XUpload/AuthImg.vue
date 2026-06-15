<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   AuthImg 受控图片预览（本地驱动受控 URL 鉴权取流；XTable 图片列配套）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { releaseBlobUrl, resolvePreviewUrl } from '@/api/file'

/**
 * 列表单元格图片预览：受控 URL（/admin/v1/files/:id/raw）经鉴权取流为 blob:，
 * 公网 URL 直显；点击大图查看。配套 XUpload，schema 见 docs/CRUD-SCHEMA.md §7。
 */
const props = withDefaults(
  defineProps<{
    src: string
    /** 缩略图高度 px，默认 48 */
    height?: number
  }>(),
  { height: 48 },
)

const preview = ref('')

watch(
  () => props.src,
  async (src) => {
    releaseBlobUrl(preview.value)
    preview.value = ''
    if (!src) {
      return
    }
    try {
      preview.value = await resolvePreviewUrl(src)
    } catch {
      // 取流失败（无权限/文件已删）：留空显示占位
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => releaseBlobUrl(preview.value))
</script>

<template>
  <el-image
    v-if="preview"
    :src="preview"
    :preview-src-list="[preview]"
    preview-teleported
    fit="cover"
    :style="{ height: `${height}px`, width: `${Math.round(height * 1.78)}px` }"
    class="rounded align-middle"
  />
  <span v-else class="text-12px text-[var(--el-text-color-secondary)]">{{ src ? '预览不可用' : '—' }}</span>
</template>
