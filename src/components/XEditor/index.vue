<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XEditor 富文本编辑器（M4-A 黄金样板：wangEditor v5 封装，v-model 绑 HTML）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/api/file'

/**
 * 富文本黄金样板（可复用，schema 文档见 docs/CRUD-SCHEMA.md §7）：
 * - wangEditor v5（MIT），v-model 绑定 HTML 字符串，直接对接后端富文本字段；
 * - 图片上传走 M2-D 文件通道（XUpload 同源，不新开上传通道），插入后端返回 url；
 * - 安全分工：编辑器自身产出受控 HTML，后端 HtmlPurifier 白名单净化兜底（§8 XSS）。
 * 已知项：本地存储驱动的图片为受控 URL（需鉴权），编辑区/详情 <img> 无法匿名直链，
 * 生产建议切 OSS/七牛公网 URL（M2-D 驱动就绪），见完成报告。
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    /** 编辑区高度 px，默认 320 */
    height?: number
    placeholder?: string
    disabled?: boolean
  }>(),
  { height: 320, placeholder: '请输入正文…', disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

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

const toolbarConfig: Partial<IToolbarConfig> = {
  // 视频/代码语言等重型菜单本阶段不开，保持与后端净化白名单对齐
  excludeKeys: ['group-video', 'fullScreen'],
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {
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
</script>

<template>
  <div class="w-full rounded border border-[var(--el-border-color)]">
    <Toolbar
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
      class="border-b border-[var(--el-border-color)]"
    />
    <Editor
      v-model="valueHtml"
      :default-config="editorConfig"
      mode="default"
      :style="{ height: `${height}px`, overflowY: 'hidden' }"
      @on-created="onCreated"
    />
  </div>
</template>
