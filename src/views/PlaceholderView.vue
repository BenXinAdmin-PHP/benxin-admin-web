<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   动态路由占位页（菜单 CRUD 页面在后续里程碑补齐）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-09
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span class="font-600">{{ (route.meta.title as string) || route.name }}</span>
    </template>
    <el-empty :description="`「${(route.meta.title as string) || route.path}」页面占位 —— 动态路由已生效（${route.path}）`" />
  </el-card>
</template>
