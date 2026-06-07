# CLAUDE.md · benxin-admin-web（管理后台前端）

> 本文件是 Claude Code 在本仓库的执行铁律。完整背景见后端仓库 `docs/ARCHITECTURE.md`（架构基线与约定），冲突时以基线文档为准；本文件冲突处先停下来问 daxing。

## 你的职责边界
- 你负责：编码、与后端联调自测、Git 提交与双推、回填可复制 Markdown 完成报告。
- 你不负责：架构决策（由 PM/架构师任务书给出）。任务书未覆盖处先问，不要自行拍板。
- 全程中文。

## 项目命名（唯一权威拼写）
- 代码、文档、注释、`package.json`、README 一律用 **`BenXinAdmin`**。
- ⚠️ **仓库名是例外**：Gitee `binxin`、GitHub `benxin`，两边不一致。只有 `git remote` 地址按实际值。

## 技术栈（锁定）
- Node 24；Vue **3.5+** + **TypeScript（强制）**；Vite 跟随脚手架默认（7/8，勿锁 5）。
- Element Plus **2.14.x**（按需自动导入）；Pinia + Vue Router 4；**UnoCSS**；Axios（统一封装）。
- 工程结构参考 vue-pure-admin / vue-vben-admin(5.x EP 版)，**仅借鉴，不直接用作底座**。
- 配 ESLint + Prettier。

## 目录骨架（src 下）
`api/`（OpenAPI 自动生成的调用文件）、`components/`（含 XTable 配置化 CRUD 组件）、`directives/`（`v-permission` 按钮级权限）、`layouts/`（含多标签页）、`locales/`（i18n，初期只中文，框架预留）、`router/`（动态路由，菜单从后端拉取）、`stores/`（Pinia）、`utils/`（axios 封装 / 主题切换）。

## 核心特性（按任务书逐步实现）
动态路由、按钮级权限（`v-permission="['user:add']"`）、多标签页、主题切换（暗色 + 主题色）、i18n、配置化 CRUD 组件 `<XTable>`。需自适应 PC / 平板 / 手机。

## 对接后端 API（业务码风格 A）
- 统一返回 `{ code, msg, data, request_id, timestamp }`，`code=0` 成功；Axios 拦截器据 `code` 统一处理。
- 鉴权类后端会返回 HTTP 401，拦截器据此跳登录 / 刷新 token。
- 后台接口前缀 `/admin/v1/...`；分页 `data:{ list, total, page, page_size }`。
- token 注入请求头；access 过期用 refresh 自动续期。

## 文件注释头（每个新建/修改文件强制）
```ts
/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   <中文模块名>
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      <创建时间>
 * | @updated   <修改时间，仅修改时追加>
 * +----------------------------------------------------------------------
 */
```

## 资源合规
- 只用开源可商用字体/图标/图片。图标用 Element Plus Icons(MIT) / Iconify 开源集（Remix Apache-2.0、Tabler MIT、Lucide ISC）。字体优先系统栈或 OFL 开源字体。禁用商用字库与来源不明素材。

## 安全
- 任何密钥/敏感配置不得硬编码进前端；`.env*` 入 `.gitignore`，仅 `.env.example` 入库。
- 输出渲染注意 XSS；不在前端做权限的最终裁决（后端为准）。

## Git 双推（Gitee 主、GitHub 镜像）
首次初始化（仓库根目录执行一次）：
```bash
git init
git branch -M main
git remote add origin https://gitee.com/binxin-admin/binxin-admin-web.git
git remote set-url --add --push origin https://gitee.com/binxin-admin/binxin-admin-web.git
git remote set-url --add --push origin https://github.com/BenXinAdmin-PHP/benxin-admin-web.git
git checkout -b dev
```
日常提交 + 双推：
```bash
git add -A
git commit -m "feat: xxx"   # Conventional Commits
git push origin dev         # 同时推 Gitee 与 GitHub
```
验证：`git remote -v` 中 origin 有两个 push 地址。

## 完成任务后
回填任务书的「完成报告」模板（可复制 Markdown），记录实际版本号、验收结果、偏差与待确认项。
