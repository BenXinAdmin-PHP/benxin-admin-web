<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   默认布局（可收起侧栏 + 面包屑 + 主题入口 + 头像下拉，卡片化主区）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  | @updated   2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Expand, Fold, HomeFilled, SwitchButton } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import MenuTree from './MenuTree.vue'
import ThemePanel from './ThemePanel.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const displayName = computed(() => userStore.user?.nickname || userStore.user?.username || '')
const avatarText = computed(() => displayName.value.slice(0, 1).toUpperCase())

// 侧栏收起态（持久化，刷新保持）
const STORAGE_COLLAPSE = 'bx-sidebar-collapse'
const collapsed = ref(localStorage.getItem(STORAGE_COLLAPSE) === '1')
function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_COLLAPSE, collapsed.value ? '1' : '0')
}

// 面包屑：首页 + 当前路由（matched 中带 title 的层级，回退 route.meta.title）
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  if (matched.length) {
    return matched.map((r) => String(r.meta.title))
  }
  return route.meta.title ? [String(route.meta.title)] : []
})

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
  <el-container class="bx-layout">
    <el-aside class="bx-aside" :width="collapsed ? '64px' : '224px'">
      <div class="bx-logo">
        <div class="bx-logo__mark">BX</div>
        <span v-show="!collapsed" class="bx-logo__text">{{ t('app.name') }}</span>
      </div>
      <el-scrollbar class="bx-menu-scroll">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          :collapse-transition="false"
          router
          unique-opened
        >
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          <MenuTree :menus="userStore.menus" />
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="bx-header">
        <div class="bx-header__left">
          <el-button
            text
            circle
            :icon="collapsed ? Expand : Fold"
            title="收起/展开"
            @click="toggleCollapse"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(b, i) in breadcrumbs" :key="i">{{ b }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="bx-header__right">
          <ThemePanel />
          <el-dropdown>
            <span class="bx-user">
              <span class="bx-user__avatar">{{ avatarText }}</span>
              <span class="bx-user__name">{{ displayName }}</span>
              <el-icon class="bx-user__caret"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="HomeFilled" @click="router.push('/home')">
                  首页
                </el-dropdown-item>
                <el-dropdown-item divided :icon="SwitchButton" @click="handleLogout">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="bx-main">
        <RouterView v-slot="{ Component }">
          <transition name="bx-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.bx-layout {
  min-height: 100vh;
}

/* —— 侧栏 —— */
.bx-aside {
  display: flex;
  flex-direction: column;
  background: var(--bx-sidebar-bg);
  transition: width 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
  /* 把 EP 菜单变量接到侧栏 token，实现「深色侧栏 + 浅色主区」 */
  --el-menu-bg-color: var(--bx-sidebar-bg);
  --el-menu-text-color: var(--bx-sidebar-text);
  --el-menu-active-color: var(--bx-sidebar-text-active);
  --el-menu-hover-bg-color: color-mix(in srgb, var(--bx-sidebar-text) 12%, transparent);
  --el-menu-hover-text-color: var(--bx-sidebar-text-active);
}
.bx-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  flex-shrink: 0;
}
.bx-logo__mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 9px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  background: var(--bx-color-primary);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--bx-color-primary) 45%, transparent);
}
.bx-logo__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--bx-sidebar-text-active);
  white-space: nowrap;
}
.bx-menu-scroll {
  flex: 1;
  min-height: 0;
}
.bx-aside :deep(.el-menu) {
  border-right: none;
  padding: 6px 8px;
}
.bx-aside :deep(.el-menu-item),
.bx-aside :deep(.el-sub-menu__title) {
  height: 46px;
  border-radius: 8px;
  margin-bottom: 2px;
}
.bx-aside :deep(.el-menu-item.is-active) {
  background: var(--bx-sidebar-item-active-bg);
  color: var(--bx-sidebar-text-active);
  font-weight: 600;
}
.bx-aside :deep(.el-menu--collapse) {
  padding: 6px;
}

/* —— 顶栏 —— */
.bx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: var(--bx-topbar-bg);
  border-bottom: 1px solid var(--bx-border);
}
.bx-header__left,
.bx-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
/* gov 主题顶栏为深蓝渐变，面包屑/按钮转白字 */
:global(html[data-theme='gov']) .bx-header :deep(.el-breadcrumb__inner),
:global(html[data-theme='gov']) .bx-header :deep(.el-breadcrumb__separator),
:global(html[data-theme='gov']) .bx-header .el-button {
  color: rgba(255, 255, 255, 0.92);
}
.bx-user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 999px;
  transition: background-color 0.18s ease;
}
.bx-user:hover {
  background: var(--bx-color-primary-soft);
}
.bx-user__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: var(--bx-color-primary);
}
.bx-user__name {
  font-size: 14px;
  color: var(--bx-text-primary);
}
.bx-user__caret {
  color: var(--bx-text-tertiary);
}
:global(html[data-theme='gov']) .bx-user__name {
  color: rgba(255, 255, 255, 0.92);
}
:global(html[data-theme='gov']) .bx-user:hover {
  background: rgba(255, 255, 255, 0.14);
}

/* —— 主区 —— */
.bx-main {
  background: var(--bx-page-bg);
  padding: 18px;
}

/* 路由切换淡入淡出 */
.bx-fade-enter-active,
.bx-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.bx-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.bx-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
