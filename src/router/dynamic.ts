/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   动态路由构建（由 profile.menus 树生成路由记录）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-09
 * +----------------------------------------------------------------------
 */
import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/api/auth'

// 预扫描所有视图组件；菜单的 component（如 'system/admin/index'）映射到 /src/views/<component>.vue。
// 暂未实现的页面回退到占位页（M1-D 聚焦认证闭环，CRUD 页面在后续里程碑补齐）。
const viewModules = import.meta.glob('/src/views/**/*.vue')

function resolveComponent(component: string) {
  if (component) {
    const key = `/src/views/${component}.vue`
    if (viewModules[key]) {
      return viewModules[key]
    }
  }
  return () => import('@/views/PlaceholderView.vue')
}

/**
 * 由菜单树生成扁平路由（仅 type=2 菜单生成路由；目录仅用于侧边菜单分组）。
 * 路由作为布局路由的子路由注册，path 去掉前导斜杠以拼成 /system/xxx。
 */
export function buildDynamicRoutes(menus: MenuNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  const walk = (nodes: MenuNode[]) => {
    for (const node of nodes) {
      if (node.type === 2 && node.path) {
        routes.push({
          path: node.path.replace(/^\//, ''),
          name: node.name || `menu-${node.id}`,
          component: resolveComponent(node.component),
          meta: { title: node.title, icon: node.icon },
        })
      }
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(menus)

  return routes
}
