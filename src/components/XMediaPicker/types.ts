/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   通用素材选择器类型（选中回填载荷 — 富文本/og_image/banner 复用）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-21
 * +----------------------------------------------------------------------
 */

/** 选择器可过滤的媒体类型（与后端 media_type 同口径，当前仅图片/视频两种消费场景） */
export type MediaPickType = 'image' | 'video'

/**
 * 选中素材回填载荷（confirm 事件 emit）。
 *
 * ★ url 形态须知（诊断盘点结论）：
 *   - 云存储（OSS/七牛/腾讯VOD）：url 为公网/签名「绝对地址」，可直接喂 <img>/<video>/og_image。
 *   - 本地存储（local）：url 为受控相对路由 `/admin/v1/resources/:id/raw`，需 Bearer 鉴权取流，
 *     不能直接作为公开 <img src>。富文本/og 等「公开消费」场景应使用云存储素材；
 *     local 素材的公开直链需后端后续提供（已报告 PM，超本组件范围）。
 *   故同时回填 storage，便于消费方按存储类型决策。
 */
export interface MediaPickResult {
  id: number
  /** 素材 URL：云存储=绝对直链；本地=受控相对路由（详见上方须知） */
  url: string
  name: string
  media_type: string
  size: number
  mime: string
  ext: string
  /** 存储驱动：local / oss / qiniu / vod_tx —— 消费方据此判断 url 是否为可公开直链 */
  storage: string
}
