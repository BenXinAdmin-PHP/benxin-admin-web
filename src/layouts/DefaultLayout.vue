<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   默认布局（侧边动态菜单 + 顶栏用户/登出）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  | @updated   2026-06-09
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import MenuTree from './MenuTree.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const displayName = computed(() => userStore.user?.nickname || userStore.user?.username || '')

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' })
  } catch {
    return
  }
  await userStore.logout()
  ElMessage.success('已退出登录')
  // 重置动态路由：刷新页面让 router 回到仅静态路由状态，避免残留
  window.location.hash = '#/login'
  window.location.reload()
}
</script>

<template>
  <el-container class="min-h-screen">
    <el-aside width="220px" class="border-r border-[var(--el-border-color)]">
      <div class="flex h-14 items-center justify-center text-base font-600">
        {{ t('app.name') }}
      </div>
      <el-menu :default-active="activeMenu" router unique-opened>
        <el-menu-item index="/home">首页</el-menu-item>
        <MenuTree :menus="userStore.menus" />
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="flex items-center justify-between border-b border-[var(--el-border-color)]">
        <span class="text-[var(--el-text-color-secondary)]">{{ route.meta.title }}</span>
        <el-dropdown>
          <span class="cursor-pointer">{{ displayName }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
