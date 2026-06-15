<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   菜单图标解析（后端 menu.icon 字符串 → Element Plus 图标组件，缺省兜底）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed } from 'vue'
import {
  Avatar,
  Bell,
  Briefcase,
  ChatDotRound,
  Coin,
  Collection,
  Document,
  Files,
  Folder,
  Grid,
  Histogram,
  List,
  Memo,
  Menu as MenuIcon,
  Money,
  Notebook,
  OfficeBuilding,
  Picture,
  Promotion,
  Setting,
  Tickets,
  User,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

const props = defineProps<{ name?: string }>()

// 后端 seeder 播种的 icon 字符串 → EP 图标组件（覆盖现有菜单清单，未命中兜底 MenuIcon）
const MAP: Record<string, Component> = {
  user: User,
  avatar: Avatar,
  menu: MenuIcon,
  'office-building': OfficeBuilding,
  briefcase: Briefcase,
  collection: Collection,
  setting: Setting,
  folder: Folder,
  files: Files,
  money: Money,
  coin: Coin,
  document: Document,
  notebook: Notebook,
  memo: Memo,
  tickets: Tickets,
  bell: Bell,
  message: ChatDotRound,
  picture: Picture,
  promotion: Promotion,
  list: List,
  grid: Grid,
  histogram: Histogram,
}

const icon = computed<Component>(() => MAP[props.name ?? ''] ?? MenuIcon)
</script>

<template>
  <el-icon><component :is="icon" /></el-icon>
</template>
