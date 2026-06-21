<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XEditor 富文本编辑器（M4-A 黄金样板；ADR-27-② 加 builder 档：工具栏对齐净化白名单 + 图/视频走素材库禁直传）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  | @updated   2026-06-21（ADR-27-②：preset prop；builder 档对齐 RICHTEXT_ALLOWED、图/视频接 XMediaPicker、方案A <video>）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { SlateElement, type IDomEditor, type IEditorConfig, type IToolbarConfig } from '@wangeditor/editor'
import { ElMessage } from 'element-plus'
import { Picture, VideoCamera } from '@element-plus/icons-vue'
import { uploadFile } from '@/api/file'
import XMediaPicker from '@/components/XMediaPicker/index.vue'
import type { MediaPickResult } from '@/components/XMediaPicker/types'
import './videoElement' // 副作用导入：注册方案A <video> 自定义元素（全局一次，content 档不受影响）

/**
 * 富文本黄金样板（schema 文档见 docs/CRUD-SCHEMA.md §7）：
 * - wangEditor v5（MIT），v-model 绑定 HTML 字符串，对接后端富文本字段；
 * - 安全分工：server 为唯一权威净化门（内容模块 HtmlPurifier::clean / 搭建器 cleanBuilderRichtext），
 *   前端工具栏档位仅消「所见≠所得」、非安全边界（ADR-27 决策⑥）。
 *
 * preset 档位（ADR-27-②，走方案 a 复用本组件）：
 * - 'content'（默认，零改 M4-A）：当前内容模块工具栏原样（仅排除 group-video/fullScreen），图片走 M2-D /files 直传。
 * - 'builder'（搭建器 richtext 块）：工具栏对齐 server RICHTEXT_ALLOWED（表格/字色/背景色/字号/字体/行高/对齐/任务清单 +
 *   方案A 视频），额外排除白名单外项（hr/pre/u/s/H1/H5/sup/sub）；禁 wangEditor 任何直传，图/视频改走 XMediaPicker。
 * 已知项：本地存储驱动素材为受控 URL（需鉴权），公开 <img>/<video> 匿名直链不可达，插入时如实 warning 提示。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** 编辑区高度 px，默认 320 */
    height?: number
    placeholder?: string
    disabled?: boolean
    /** 工具栏档位：content=内容模块现状（默认）/ builder=搭建器富文本块扩展档 */
    preset?: 'content' | 'builder'
  }>(),
  { height: 320, placeholder: '请输入正文…', disabled: false, preset: 'content' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isBuilder = computed(() => props.preset === 'builder')

// 本地素材公开不可达提示（图/视频插入共用；杜绝静默失败，守 honest completion）
const LOCAL_TIP = '本地存储素材在官网公开页可能无法显示，生产建议改用云存储或开启图片公开直链'

// wangEditor 实例须用 shallowRef（官方要求，避免深响应化破坏内部状态）
const editorRef = shallowRef<IDomEditor>()
const valueHtml = ref(props.modelValue)

watch(
  () => props.modelValue,
  (v) => {
    if (v !== valueHtml.value) {
      valueHtml.value = v
    }
  },
)

watch(valueHtml, (v) => {
  // 空文档归一化为空串，对接后端 require 校验
  emit('update:modelValue', editorRef.value?.isEmpty() ? '' : v)
})

/**
 * builder 档排除项：均为 server cleanBuilderRichtext 白名单不放行、留着会「所见≠所得」的菜单。
 * hr=divider / pre=codeBlock / u=underline / s=through / H1·H5=headerSelect（改用 header2/header3 仅留 H2/H3）/ sup / sub；
 * 另关图片(group-image)与视频(group-video)全部直传入口——图/视频只走 XMediaPicker（禁 wangEditor 直传）。
 */
const BUILDER_EXCLUDE_KEYS = [
  'group-image',
  'group-video',
  'insertImage',
  'uploadImage',
  'insertVideo',
  'uploadVideo',
  'headerSelect', // 含 H1/H5
  'divider', // hr
  'codeBlock', // pre
  'underline', // u
  'through', // s
  'sup',
  'sub',
  'fullScreen',
]

// 档位配置在 setup 期按 preset 定型（preset 单实例固定，wangEditor 仅创建时读一次）
const toolbarConfig: Partial<IToolbarConfig> = isBuilder.value
  ? {
      excludeKeys: BUILDER_EXCLUDE_KEYS,
      // headerSelect 已排除（含 H1/H5）→ 显式补 H2/H3 按钮（白名单含 h2/h3/h4；wangEditor 无 header4 按钮，H4 不暴露）
      insertKeys: { index: 2, keys: ['header2', 'header3'] },
    }
  : // content 档：与改前逐字一致（M4-A 零影响）
    { excludeKeys: ['group-video', 'fullScreen'] }

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  // builder 档禁 wangEditor 任何直传（不注册 uploadImage/uploadVideo）；content 档保留 M2-D 图片直传（原样）
  MENU_CONF: isBuilder.value
    ? {}
    : {
        uploadImage: {
          // 自定义上传：走 M2-D /files/upload（finfo 真实 MIME + 白名单 + 重命名）
          async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
            try {
              const { data } = await uploadFile(file)
              insertFn(data.url, data.original_name, '')
            } catch {
              ElMessage.error('图片上传失败')
            }
          },
        },
      },
}

function onCreated(editor: IDomEditor) {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})

// ---------------- builder 档：图/视频走 XMediaPicker ----------------
const imgPickerOpen = ref(false)
const videoPickerOpen = ref(false)

/** 插入前恢复选区（点外部按钮致编辑器失焦；无历史选区则聚焦末尾兜底） */
function prepareInsert(editor: IDomEditor) {
  editor.restoreSelection()
  if (!editor.selection) editor.focus()
}

/** 图片确认（multiple）：逐个插入 <img src alt>；含本地素材提示一次 */
function onPickImages(payload: MediaPickResult | MediaPickResult[]) {
  const editor = editorRef.value
  if (!editor) return
  const arr = Array.isArray(payload) ? payload : [payload]
  if (!arr.length) return
  prepareInsert(editor)
  let hasLocal = false
  for (const m of arr) {
    if (m.storage === 'local') hasLocal = true
    editor.dangerouslyInsertHtml(`<img src="${escAttr(m.url)}" alt="${escAttr(m.name)}"/>`)
  }
  if (hasLocal) ElMessage.warning(LOCAL_TIP)
}

/** 视频确认（single）：插入方案A <video> 自定义节点；含本地素材提示一次 */
function onPickVideo(payload: MediaPickResult | MediaPickResult[]) {
  const editor = editorRef.value
  if (!editor) return
  const m = Array.isArray(payload) ? payload[0] : payload
  if (!m) return
  prepareInsert(editor)
  editor.insertNode({ type: 'mediaVideo', src: m.url, children: [{ text: '' }] } as SlateElement)
  if (m.storage === 'local') ElMessage.warning(LOCAL_TIP)
}

/** HTML 属性值转义（与 videoElement 同口径） */
function escAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
</script>

<template>
  <div class="w-full rounded border border-[var(--el-border-color)]">
    <div class="bx-editor-bar">
      <Toolbar
        :editor="editorRef"
        :default-config="toolbarConfig"
        mode="default"
        class="bx-editor-toolbar"
      />
      <!-- builder 档：图/视频素材库入口（禁 wangEditor 直传，只「选」素材） -->
      <div v-if="isBuilder" class="bx-editor-media-btns">
        <el-button size="small" :icon="Picture" :disabled="disabled" @click="imgPickerOpen = true">
          图片
        </el-button>
        <el-button size="small" :icon="VideoCamera" :disabled="disabled" @click="videoPickerOpen = true">
          视频
        </el-button>
      </div>
    </div>
    <Editor
      v-model="valueHtml"
      :default-config="editorConfig"
      mode="default"
      :style="{ height: `${height}px`, overflowY: 'hidden' }"
      @on-created="onCreated"
    />

    <!-- builder 档素材选择器：图片多选 / 视频单选（方案A） -->
    <template v-if="isBuilder">
      <XMediaPicker v-model="imgPickerOpen" type="image" multiple @confirm="onPickImages" />
      <XMediaPicker v-model="videoPickerOpen" type="video" @confirm="onPickVideo" />
    </template>
  </div>
</template>

<style scoped>
.bx-editor-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color);
}
.bx-editor-toolbar {
  flex: 1;
  min-width: 0;
}
.bx-editor-media-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  padding: 0 8px;
}
</style>
