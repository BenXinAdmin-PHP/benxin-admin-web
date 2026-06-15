<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   素材多模式上传（A 链路服务端中转 / B 链路 VOD 客户端直传，自动分流）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-15
  | @updated   2026-06-15（hotfix：失败如实报错 + 大文件预判杜绝假完成；收尾：预判上限对齐100 + 成功文案单段化）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import {
  RESOURCE_MAX_UPLOAD_MB,
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
      // 仅代表「链路切换」，不代表成功——仍须走完真实本地上传并如实反馈结果
      task.note = 'VOD 未开通，转本地上传中…'
      await serverUpload(file, task)
      task.note = 'VOD 未开通，已转本地'
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
  task.note =
    data.transcode_status === 1 || data.transcode_status === 2
      ? '直传完成·转码中（腾讯VOD）'
      : '直传完成（腾讯VOD）'
}

/** A 链路：服务端中转上传（本地/七牛/OSS 由后端 forMediaType 路由） */
async function serverUpload(file: File, task: UploadTask) {
  // ① 大小预判（丙）：超本地上限直接拦截、不发注定被 PHP 限额拒的废请求
  if (file.size > RESOURCE_MAX_UPLOAD_MB * 1024 * 1024) {
    const isAV = ['video', 'audio'].includes(guessMediaType(file.name))
    throw new Error(
      `文件 ${humanSize(file.size)} 超过服务端上传上限 ${RESOURCE_MAX_UPLOAD_MB}MB，` +
        (isAV ? '请开通 VOD 后上传大视频，或压缩后重传' : '请压缩后重传'),
    )
  }

  // ② 真实上传 + 如实校验结果：仅当后端确认 code=0 且回填记录 id 才算成功；
  //    否则（文件超 php 限额被服务器在进 app 前拒 / 响应非标准信封）一律失败，★绝不假完成
  const res = await uploadResource(file, props.categoryId, (p) => {
    task.percent = p
  })
  if (!res || res.code !== 0 || !res.data?.id) {
    throw new Error('上传失败：服务端未确认结果（可能文件过大被服务器拒绝，请调大 php 限额或开通 VOD）')
  }
  task.channel = res.data.storage
  // 单段成功文案（普通 local/云直传；VOD 回退 local 由调用方覆盖为「VOD 未开通，已转本地」）
  task.note = `已上传（${channelLabel[res.data.storage] ?? res.data.storage}）`
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
          <!-- 单段文案：成功「已上传（驱动）/VOD 未开通，已转本地/直传完成（腾讯VOD）」、失败「✗ 原因」 -->
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
