# BenXinAdmin · benxin-admin-web（管理后台前端）

BenXinAdmin 管理后台的前端工程。技术栈：Vue 3.5 + TypeScript + Vite 8、Element Plus（按需自动导入）、Pinia、Vue Router、UnoCSS、vue-i18n、Axios（统一封装，业务码风格 A）。

> 阶段：M0-B 脚手架 —— 可运行骨架 + 与后端 `GET /admin/v1/ping` 联调。动态路由 / 鉴权 / 按钮级权限 / 多标签页 / 主题切换等留待 M1。

## 环境要求

- Node 24+
- 后端本地服务（`php think run`，默认 `http://127.0.0.1:8000`）；前端按 `code===0` 判定业务成功。

## 环境变量

复制 `.env.example` 为 `.env.development`（已被 `.gitignore` 忽略，勿入库），按本地后端端口调整：

```sh
VITE_API_BASE=http://127.0.0.1:8000/admin
```

## 常用命令

```sh
npm install      # 安装依赖
npm run dev      # 启动开发服务器（热更新）
npm run build    # 类型检查 + 生产构建
npm run lint     # oxlint + eslint（--fix）
npm run format   # prettier 格式化 src/
```

## 目录骨架（`src/`）

`api/`（接口调用，OpenAPI 自动生成留待 M1）、`components/`（含 XTable 配置化 CRUD 组件，M1）、`directives/`（`v-permission` 按钮级权限，M1）、`layouts/`（含多标签页，M1）、`locales/`（i18n，初期仅中文）、`router/`（M1 动态路由）、`stores/`（Pinia）、`utils/`（Axios 封装等）、`types/`（unplugin 自动生成的类型声明）。
