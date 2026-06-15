<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   素材媒体预览弹窗（图片/视频/音频/文档；原生播放器，不引 SDK）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-15
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { releaseBlobUrl, resolvePreviewUrl } from '@/api/file'
import { humanSize } from '@/api/resource'
import type { ResourceItem } from '@/api/resource'

const props = defineProps<{ item: ResourceItem | null }>()
const visible = defineModel<boolean>({ required: true })

const src = ref('') // 可直接喂 <img>/<video>/<audio>/<iframe> 的地址（本地=blob，云/VOD=直链）
const loading = ref(false)
const blocked = ref('') // 非空 = 不可预览的原因（如 VOD 转码未完成）

/** VOD 资源是否可播：非 VOD 恒可；VOD 仅 0(无需转码)/3(可播放) 放行 */
function transcodeBlockReason(it: ResourceItem): string {
  if (it.storage !== 'vod_tx') return ''
  if (it.transcode_status === 3 || it.transcode_status === 0) return ''
  if (it.transcode_status === 4) return '该视频转码失败，无法播放'
  return '该视频正在转码中，请稍后再试'
}

async function resolve(it: ResourceItem) {
  releaseCurrent()
  src.value = ''
  blocked.value = transcodeBlockReason(it)
  if (blocked.value) return
  loading.value = true
  try {
    // 本地受控 url(/admin/.../raw) → 带鉴权取 blob；云/VOD 公网或签名 url → 原样直连
    src.value = await resolvePreviewUrl(it.url)
  } catch {
    ElMessage.error('素材取流失败（可能签名过期或文件已删，请刷新列表重试）')
  } finally {
    loading.value = false
  }
}

function releaseCurrent() {
  if (src.value) releaseBlobUrl(src.value)
}

watch(
  () => (visible.value ? props.item : null),
  (it) => {
    if (it) resolve(it)
  },
)
watch(visible, (v) => {
  if (!v) {
    releaseCurrent()
    src.value = ''
  }
})

function isImage(): boolean {
  return props.item?.media_type === 'image'
}
function isVideo(): boolean {
  return props.item?.media_type === 'video'
}
function isAudio(): boolean {
  return props.item?.media_type === 'audio'
}
function isPdf(): boolean {
  return props.item?.ext === 'pdf'
}

/** 文档/其他：受控下载（blob 触发浏览器下载，本地需鉴权不能直链） */
async function download() {
  if (!props.item) return
  try {
    const url = await resolvePreviewUrl(props.item.url)
    const a = document.createElement('a')
    a.href = url
    a.download = props.item.original_name || props.item.name || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    releaseBlobUrl(url)
  } catch {
    ElMessage.error('下载失败')
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="item?.name ?? '预览'"
    width="720"
    append-to-body
    destroy-on-close
  >
    <div v-loading="loading" class="bx-preview">
      <!-- 不可预览（VOD 转码未完成/失败） -->
      <el-empty v-if="blocked" :description="blocked" />

      <!-- 图片 -->
      <el-image
        v-else-if="isImage() && src"
        :src="src"
        fit="contain"
        :preview-src-list="[src]"
        class="bx-preview__img"
      />

      <!-- 视频（原生播放器，不引 SDK；ADR-19 PlayAuth/防盗链留上层） -->
      <video v-else-if="isVideo() && src" :src="src" controls class="bx-preview__media" />

      <!-- 音频 -->
      <audio v-else-if="isAudio() && src" :src="src" controls class="bx-preview__audio" />

      <!-- PDF 内嵌 -->
      <iframe v-else-if="isPdf() && src" :src="src" class="bx-preview__pdf" />

      <!-- 其他文档/压缩包：下载 -->
      <div v-else class="bx-preview__file">
        <div class="bx-preview__file-name">{{ item?.original_name || item?.name }}</div>
        <div class="bx-preview__file-meta">
          {{ item?.ext?.toUpperCase() }} · {{ humanSize(item?.size) }}
        </div>
        <el-button type="primary" @click="download">下载</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.bx-preview {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bx-preview__img {
  max-width: 100%;
  max-height: 60vh;
}
.bx-preview__media {
  max-width: 100%;
  max-height: 60vh;
  background: #000;
}
.bx-preview__audio {
  width: 100%;
}
.bx-preview__pdf {
  width: 100%;
  height: 60vh;
  border: none;
}
.bx-preview__file {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.bx-preview__file-name {
  font-weight: 600;
  color: var(--bx-text-primary);
}
.bx-preview__file-meta {
  font-size: 13px;
  color: var(--bx-text-tertiary);
}
</style>
