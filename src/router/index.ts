/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   路由实例 + 鉴权守卫 + 动态路由注册
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-09
 * +----------------------------------------------------------------------
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { buildDynamicRoutes } from './dynamic'

// 静态路由：登录页 + 布局壳（动态菜单路由作为 'layout' 的子路由在登录后注册）
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' },
      },
      // 页面搭建器（M6-C）：不挂后端菜单，从「页面管理」列表「编辑」进入（带 ?id=）。
      // 列表页 site/page/index 由 PageMenuSeeder 菜单动态注册，此处仅补 builder 静态子路由。
      {
        path: 'site/page/builder',
        name: 'site-page-builder',
        component: () => import('@/views/site/page/builder.vue'),
        meta: { title: '页面搭建器' },
      },
      // XMediaPicker 组件自测 demo（ADR-27-素材选择器）：不挂后端菜单，直接访问 #/dev/media-picker-demo。
      {
        path: 'dev/media-picker-demo',
        name: 'dev-media-picker-demo',
        component: () => import('@/views/dev/media-picker-demo.vue'),
        meta: { title: '素材选择器 Demo' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫：未登录拦截、登录后拉 profile 并注册动态路由
router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const hasToken = !!userStore.accessToken

  if (to.path === '/login') {
    return hasToken ? '/' : true
  }

  if (!hasToken) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 已登录但动态路由未就绪（首登或刷新页面）→ 拉 profile + 建路由
  if (!userStore.routesReady) {
    try {
      const profile = await userStore.fetchProfile()
      buildDynamicRoutes(profile.menus).forEach((r) => router.addRoute('layout', r))
      userStore.routesReady = true
      // 重新进入以匹配刚注册的路由
      return { ...to, replace: true }
    } catch {
      userStore.clearSession()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router
