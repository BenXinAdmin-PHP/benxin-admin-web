/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   国际化语言包（简体中文）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-08
 * | @updated   2026-06-15 11:00:00
 * +----------------------------------------------------------------------
 */
export default {
  app: {
    // 后台界面左上角 Logo 区显示文案（仅此一处界面显示改中文，代码/文档标识仍统一 BenXinAdmin）
    name: '本心管理后台',
  },
  home: {
    title: '后端联调自测',
    description: '调用 /admin/v1/ping，按业务码 code===0 判定成功。',
    ping: '发起 Ping',
    pinging: '请求中…',
    success: '联调成功',
    failed: '联调失败',
  },
  common: {
    code: '业务码',
    msg: '消息',
    requestId: '请求 ID',
    timestamp: '时间戳',
  },
}
