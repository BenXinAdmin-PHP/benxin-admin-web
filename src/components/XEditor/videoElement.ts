/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   wangEditor 自定义视频元素（ADR-27-② 方案A：直链 <video src controls>，对齐 server RICHTEXT_ALLOWED）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-21
 * +----------------------------------------------------------------------
 * 为何不用 wangEditor 内置 video：其 elemToHtml 产出 <video><source src/></video>（外加 poster），
 * 而 server cleanBuilderRichtext 白名单仅放行 video[src|controls]、剥 <source>/poster → 会丢失 src。
 * 故注册独立 type='mediaVideo' 元素：序列化恒为 <video src="…" controls></video>（方案A），
 * 解析端把 <video> 还原为本节点，编辑↔保存↔回显闭环与 server 白名单逐字对齐。
 * 副作用导入（被 XEditor 引入）：Boot 注册全局一次；content 档不暴露插入入口、且 content 经 clean() 已剥 video，互不影响。
 */
import { Boot, SlateElement, type IDomEditor } from '@wangeditor/editor'
import { h, type VNode } from 'snabbdom'

/** 方案A 视频节点：仅持 src（直链），void 块级元素 */
export type MediaVideoElement = SlateElement & { type: 'mediaVideo'; src: string }

/** HTML 属性值转义（防 src 内引号/尖括号破坏属性） */
function escAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 编辑区渲染：原生 <video controls>，外层 contentEditable=false（void 元素惯例） */
function renderMediaVideo(elemNode: SlateElement, _children: VNode[] | null, _editor: IDomEditor): VNode {
  const { src } = elemNode as MediaVideoElement
  const videoVnode = h('video', {
    attrs: { src, controls: 'true' },
    style: { maxWidth: '100%', maxHeight: '320px', display: 'block', margin: '0 auto' },
  })
  return h(
    'div',
    {
      attrs: { 'data-w-e-type': 'mediaVideo', contenteditable: 'false' },
      style: { textAlign: 'center', margin: '10px 0' },
    },
    [videoVnode],
  )
}

/** 序列化（保存/取 html）：方案A 直链，恒为 <video src controls>，对齐 server 白名单 */
function mediaVideoToHtml(elemNode: SlateElement): string {
  const { src } = elemNode as MediaVideoElement
  return `<video src="${escAttr(src)}" controls></video>`
}

/** 解析（载入既有 html）：<video> DOM → 本节点；children 留单空文本（void 元素惯例） */
function parseMediaVideoHtml($elem: Element): SlateElement {
  const src = $elem.getAttribute('src') || ''
  return { type: 'mediaVideo', src, children: [{ text: '' }] } as MediaVideoElement
}

/** 插件：声明 mediaVideo 为 void（不可编辑其内部，整体作为一个原子块） */
function withMediaVideo<T extends IDomEditor>(editor: T): T {
  const { isVoid } = editor
  editor.isVoid = (elem) => ((elem as MediaVideoElement).type === 'mediaVideo' ? true : isVoid(elem))
  return editor
}

// ---- 全局注册一次（ES module 单例，副作用导入即注册；在 createEditor 前完成） ----
Boot.registerPlugin(withMediaVideo)
Boot.registerRenderElem({ type: 'mediaVideo', renderElem: renderMediaVideo })
Boot.registerElemToHtml({ type: 'mediaVideo', elemToHtml: mediaVideoToHtml })
Boot.registerParseElemHtml({ selector: 'video', parseElemHtml: parseMediaVideoHtml })
