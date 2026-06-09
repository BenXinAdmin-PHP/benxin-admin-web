<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   侧边菜单递归渲染（由 profile.menus 树生成）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-09
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import type { MenuNode } from '@/api/auth'

defineProps<{ menus: MenuNode[] }>()
</script>

<template>
  <template v-for="node in menus" :key="node.id">
    <!-- 目录 / 含子节点 → 折叠分组 -->
    <el-sub-menu v-if="node.children && node.children.length" :index="node.path || `dir-${node.id}`">
      <template #title>{{ node.title }}</template>
      <MenuTree :menus="node.children" />
    </el-sub-menu>
    <!-- 菜单 → 可点击项（el-menu router 模式按 index=path 跳转） -->
    <el-menu-item v-else :index="node.path">{{ node.title }}</el-menu-item>
  </template>
</template>
