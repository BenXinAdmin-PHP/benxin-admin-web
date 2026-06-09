/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   v-permission 指令（按钮级权限显隐，perms 与后端 enforce 同源）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-09
 * +----------------------------------------------------------------------
 */
import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 用法：v-permission="'system:admin:create'" 或 v-permission="['a','b']"（任一命中即显示）。
 * 无权限时从 DOM 移除元素。超管 perms 含 '*' 由 store.hasPerm 兜底放行。
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const userStore = useUserStore()
    const value = binding.value
    const needed: string[] = Array.isArray(value) ? value : [value]

    const allowed = needed.some((p) => userStore.hasPerm(p))
    if (!allowed) {
      el.parentNode?.removeChild(el)
    }
  },
}
