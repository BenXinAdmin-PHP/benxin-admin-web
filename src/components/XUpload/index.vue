<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XUpload 图片上传（M4-A 黄金样板：消费 M2-D /files/upload，url 回填 v-model）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn, Delete } from '@element-plus/icons-vue'
import { releaseBlobUrl, resolvePreviewUrl, uploadFile } from '@/api/file'

/**
 * 图片上传黄金样板（可复用，schema 文档见 docs/CRUD-SCHEMA.md §7）：
 * - v-model 绑定 url 字符串（单图）或 url 数组（multiple 多图），与后端字段直接对接；
 * - 上传走 M2-D 文件通道（finfo 真实 MIME + 白名单 + 重命名 + 非 Web 目录），不新开通道；
 * - 本地驱动受控 URL（/admin/v1/files/:id/raw）经鉴权取流预览；云驱动公网 URL 直显；
 * - 客户端先做轻校验（图片类型 + 大小），真实校验以后端为准。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    /** 多图模式：v-model 为 url 数组 */
    multiple?: boolean
    /** 多图上限，默认 9 */
    limit?: number
    /** 单文件大小上限 MB，默认 5 */
    maxSizeMb?: number
    disabled?: boolean
  }>(),
  { multiple: false, limit: 9, maxSizeMb: 5, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()

/** 允许的图片 MIME（客户端轻校验；后端白名单为权威） */
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const uploading = ref(false)
/** 当前 url 列表（单图归一化为 0/1 元素数组处理） */
const urls = ref<string[]>([])
/** url → 预览地址（受控 URL 取流为 blob:，公网 URL 原样） */
const previews = ref<Record<string, string>>({})
/** 大图查看 */
const viewerVisible = ref(false)
const viewerIndex = ref(0)

function normalize(v: string | string[]): string[] {
  if (Array.isArray(v)) {
    return v.filter((u) => !!u)
  }
  return v ? [v] : []
}

watch(
  () => props.modelValue,
  async (v) => {
    urls.value = normalize(v)
    for (const u of urls.value) {
      if (!previews.value[u]) {
        try {
          previews.value[u] = await resolvePreviewUrl(u)
        } catch {
          // 取流失败（如无权限）：保留占位，不阻塞表单
          previews.value[u] = ''
        }
      }
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const p of Object.values(previews.value)) {
    releaseBlobUrl(p)
  }
})

function emitValue(next: string[]) {
  emit('update:modelValue', props.multiple ? next : (next[0] ?? ''))
}

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重选同一文件
  if (!file) {
    return
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/gif/webp 图片')
    return
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    ElMessage.error(`图片不能超过 ${props.maxSizeMb}MB`)
    return
  }
  uploading.value = true
  try {
    const { data } = await uploadFile(file)
    // 本地刚选的文件直接用本地预览，省一次受控取流
    previews.value[data.url] = URL.createObjectURL(file)
    emitValue(props.multiple ? [...urls.value, data.url] : [data.url])
    ElMessage.success('上传成功')
  } catch {
    // 失败消息已由拦截器弹出（如 MIME 不符 422）
  } finally {
    uploading.value = false
  }
}

function remove(url: string) {
  const preview = previews.value[url]
  if (preview) {
    releaseBlobUrl(preview)
    delete previews.value[url]
  }
  emitValue(urls.value.filter((u) => u !== url))
}

function view(url: string) {
  viewerIndex.value = urls.value.indexOf(url)
  viewerVisible.value = true
}

const canAdd = () => !props.disabled && (props.multiple ? urls.value.length < props.limit : urls.value.length === 0)
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="url in urls"
      :key="url"
      class="group relative h-100px w-100px overflow-hidden rounded border border-[var(--el-border-color)]"
    >
      <img
        v-if="previews[url]"
        :src="previews[url]"
        class="h-full w-full object-cover"
        alt=""
      />
      <div v-else class="flex h-full w-full items-center justify-center text-12px text-[var(--el-text-color-secondary)]">
        预览不可用
      </div>
      <!-- 悬浮操作层：查看 / 删除 -->
      <div
        class="absolute inset-0 hidden items-center justify-center gap-3 bg-black/45 text-white group-hover:flex"
      >
        <el-icon v-if="previews[url]" class="cursor-pointer" :size="18" @click="view(url)"><ZoomIn /></el-icon>
        <el-icon v-if="!disabled" class="cursor-pointer" :size="18" @click="remove(url)"><Delete /></el-icon>
      </div>
    </div>

    <!-- 选图按钮（label 包 input，免 ref 调用） -->
    <label
      v-if="canAdd()"
      v-loading="uploading"
      class="flex h-100px w-100px cursor-pointer items-center justify-center rounded border border-dashed border-[var(--el-border-color)] text-[var(--el-text-color-secondary)] hover:border-[var(--el-color-primary)] hover:text-[var(--el-color-primary)]"
    >
      <el-icon :size="24"><Plus /></el-icon>
      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onPick" />
    </label>

    <!-- 大图查看 -->
    <el-image-viewer
      v-if="viewerVisible"
      :url-list="urls.map((u) => previews[u]).filter((p): p is string => !!p)"
      :initial-index="viewerIndex"
      @close="viewerVisible = false"
    />
  </div>
</template>
