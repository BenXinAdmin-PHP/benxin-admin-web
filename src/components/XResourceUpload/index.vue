<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   素材多模式上传（A 链路服务端中转 / B 链路 VOD 客户端直传，自动分流）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-15
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import {
  RESOURCE_VOD_NOT_READY,
  guessMediaType,
  humanSize,
  uploadResource,
  vodConfirm,
  vodUploadSign,
} from '@/api/resource'
import type { BizError } from '@/utils/request'

const props = withDefaults(
  defineProps<{
    /** 新上传素材归属分类（当前选中分类，0=未分类） */
    categoryId?: number
    disabled?: boolean
  }>(),
  { categoryId: 0, disabled: false },
)

const emit = defineEmits<{
  /** 单个素材上传成功（页面据此刷新列表） */
  success: []
}>()

/** 单文件上传任务（进度面板用） */
interface UploadTask {
  name: string
  size: number
  percent: number
  status: 'uploading' | 'done' | 'error'
  channel: string // local / qiniu / oss / vod_tx
  note: string
}

const tasks = reactive<UploadTask[]>([])
const panelVisible = ref(false)

/** el-upload :http-request 自定义钩子——每个文件一次，内部按 media_type + VOD 开通态分流 */
async function customUpload(opt: { file: File }) {
  const file = opt.file
  const task = reactive<UploadTask>({
    name: file.name,
    size: file.size,
    percent: 0,
    status: 'uploading',
    channel: '',
    note: '',
  })
  tasks.unshift(task)
  panelVisible.value = true

  try {
    const mt = guessMediaType(file.name)
    if (mt === 'video' || mt === 'audio') {
      await uploadVideoOrAudio(file, mt, task)
    } else {
      // image / document / archive / 未知 → 服务端中转（最终由后端 finfo 归类与白名单把关）
      await serverUpload(file, task)
    }
    task.status = 'done'
    task.percent = 100
    emit('success')
  } catch (e) {
    task.status = 'error'
    task.note = (e as Error)?.message || '上传失败'
  }
}

/** 视频/音频：先试探 VOD 是否开通（silent），开通走 SDK 直传，未开通(422101)静默回退本地 */
async function uploadVideoOrAudio(file: File, mt: string, task: UploadTask) {
  try {
    // 试探签发（silent：未开通不弹全局提示）
    await vodUploadSign({ media_type: mt, file_name: file.name }, true)
  } catch (e) {
    if ((e as BizError)?.code === RESOURCE_VOD_NOT_READY) {
      task.note = 'VOD 未开通，已转本地'
      await serverUpload(file, task)
      return
    }
    throw e // 其他错误（网络等）如实抛出
  }
  // VOD 已开通 → 客户端直传（懒加载 SDK，隔离其捆绑依赖、不进主包）
  await vodDirectUpload(file, mt, task)
}

/** B 链路：vod-js-sdk-v6 客户端直传 → confirm 回填落库 */
async function vodDirectUpload(file: File, mt: string, task: UploadTask) {
  task.channel = 'vod_tx'
  const { default: TcVod } = await import('vod-js-sdk-v6')
  const tcVod = new TcVod({
    // 每次（含分片续传）实时取签名；后端按官方算法签发
    getSignature: async () => {
      const { data } = await vodUploadSign({ media_type: mt, file_name: file.name })
      return data.signature
    },
  })
  const uploader = tcVod.upload({ mediaFile: file })
  uploader.on('media_progress', (info: { percent: number }) => {
    task.percent = Math.round((info.percent ?? 0) * 100)
  })
  const result = (await uploader.done()) as { fileId: string; video?: { url: string } }
  const { data } = await vodConfirm({
    file_id: result.fileId,
    media_type: mt,
    name: file.name,
    url: result.video?.url ?? '',
    category_id: props.categoryId,
    size: file.size,
  })
  task.note = data.transcode_status === 1 || data.transcode_status === 2 ? '直传完成·转码中' : '直传完成'
}

/** A 链路：服务端中转上传（本地/七牛/OSS 由后端 forMediaType 路由） */
async function serverUpload(file: File, task: UploadTask) {
  const { data } = await uploadResource(file, props.categoryId, (p) => {
    task.percent = p
  })
  task.channel = data.storage
}

function clearFinished() {
  for (let i = tasks.length - 1; i >= 0; i--) {
    const t = tasks[i]
    if (t && t.status !== 'uploading') tasks.splice(i, 1)
  }
  if (!tasks.length) panelVisible.value = false
}

const channelLabel: Record<string, string> = {
  local: '本地',
  qiniu: '七牛',
  oss: '阿里OSS',
  vod_tx: '腾讯VOD',
}
</script>

<template>
  <span>
    <el-upload
      :show-file-list="false"
      :http-request="customUpload"
      :disabled="disabled"
      multiple
    >
      <el-button type="primary" :icon="UploadFilled" :disabled="disabled">上传素材</el-button>
    </el-upload>

    <!-- 上传进度面板 -->
    <el-dialog v-model="panelVisible" title="上传进度" width="520" append-to-body>
      <div v-if="!tasks.length" class="text-13px text-[var(--bx-text-tertiary)]">暂无上传任务</div>
      <div v-for="(t, i) in tasks" :key="i" class="bx-up-task">
        <div class="bx-up-task__row">
          <span class="bx-up-task__name" :title="t.name">{{ t.name }}</span>
          <span class="bx-up-task__size">{{ humanSize(t.size) }}</span>
        </div>
        <el-progress
          :percentage="t.percent"
          :status="t.status === 'error' ? 'exception' : t.status === 'done' ? 'success' : undefined"
          :stroke-width="10"
        />
        <div class="bx-up-task__meta">
          <span v-if="t.channel">{{ channelLabel[t.channel] ?? t.channel }}</span>
          <span v-if="t.note" :class="{ 'bx-up-task__err': t.status === 'error' }">{{ t.note }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="clearFinished">清除已完成</el-button>
        <el-button type="primary" @click="panelVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </span>
</template>

<style scoped>
.bx-up-task {
  padding: 8px 0;
  border-bottom: 1px solid var(--bx-border);
}
.bx-up-task__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
  font-size: 13px;
}
.bx-up-task__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--bx-text-primary);
}
.bx-up-task__size {
  flex-shrink: 0;
  color: var(--bx-text-tertiary);
}
.bx-up-task__meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--bx-text-secondary);
}
.bx-up-task__err {
  color: var(--el-color-danger);
}
</style>
