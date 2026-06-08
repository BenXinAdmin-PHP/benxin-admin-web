<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   默认布局（M0 最小骨架，多标签页/侧边菜单留待 M1）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <el-container class="min-h-screen">
    <el-header class="flex items-center border-b border-[var(--el-border-color)]">
      <span class="text-lg font-600">{{ t('app.name') }}</span>
    </el-header>
    <el-main>
      <RouterView />
    </el-main>
  </el-container>
</template>
