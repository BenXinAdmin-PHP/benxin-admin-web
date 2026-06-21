<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XMediaPicker 最小调用 demo（验证 image|video / 单多选 / confirm 回填 URL）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-21
  +----------------------------------------------------------------------
  说明：仅作组件自测/演示，不挂后端菜单。访问 #/dev/media-picker-demo（登录后）。
-->
<script setup lang="ts">
import { ref } from 'vue'
import XMediaPicker from '@/components/XMediaPicker/index.vue'
import type { MediaPickResult } from '@/components/XMediaPicker/types'

const imgSingleOpen = ref(false)
const imgMultiOpen = ref(false)
const videoOpen = ref(false)

const lastPayload = ref<MediaPickResult | MediaPickResult[] | null>(null)

function onConfirm(payload: MediaPickResult | MediaPickResult[]) {
  lastPayload.value = payload
}
</script>

<template>
  <el-card shadow="never">
    <template #header>XMediaPicker · 通用素材选择器 Demo</template>

    <el-space wrap>
      <el-button type="primary" @click="imgSingleOpen = true">选图片（单选）</el-button>
      <el-button type="primary" @click="imgMultiOpen = true">选图片（多选）</el-button>
      <el-button type="success" @click="videoOpen = true">选视频（单选）</el-button>
    </el-space>

    <el-divider>confirm 回填载荷</el-divider>
    <pre class="bx-demo__out">{{ lastPayload ? JSON.stringify(lastPayload, null, 2) : '（尚未选择）' }}</pre>

    <!-- 单选图片 -->
    <XMediaPicker v-model="imgSingleOpen" type="image" @confirm="onConfirm" />
    <!-- 多选图片 -->
    <XMediaPicker v-model="imgMultiOpen" type="image" multiple @confirm="onConfirm" />
    <!-- 单选视频 -->
    <XMediaPicker v-model="videoOpen" type="video" @confirm="onConfirm" />
  </el-card>
</template>

<style scoped>
.bx-demo__out {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
