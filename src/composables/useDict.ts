/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   字典取数组合式函数（模块级内存缓存，列表标签/下拉共用）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-10
 * +----------------------------------------------------------------------
 */
import { ref, type Ref } from 'vue'
import { getDictByType, type DictDataItem } from '@/api/dict'

// 同一类型整个会话只取一次（后端本身有 Valkey 缓存，此处再省 HTTP 往返）；
// 取数失败时移出缓存，下次使用可重试。
const cache = new Map<string, Ref<DictDataItem[]>>()

/**
 * 按字典类型取启用项（响应式）。同步返回空数组，取数完成后自动填充。
 * 用法：const statusDict = useDict('sys_normal_disable')
 */
export function useDict(type: string): Ref<DictDataItem[]> {
  const hit = cache.get(type)
  if (hit) {
    return hit
  }

  const options = ref<DictDataItem[]>([])
  cache.set(type, options)
  getDictByType(type)
    .then(({ data }) => {
      options.value = data
    })
    .catch(() => {
      cache.delete(type)
    })

  return options
}
