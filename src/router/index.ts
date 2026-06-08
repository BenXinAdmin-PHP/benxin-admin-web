/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   路由实例（M0 静态占位，动态路由/菜单留待 M1）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * +----------------------------------------------------------------------
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// M0 仅静态路由占位；M1 改为从后端拉取菜单并动态注册路由。
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
