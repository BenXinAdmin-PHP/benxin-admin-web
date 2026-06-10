# BenXinAdmin · 前端 CRUD 配置 Schema（M3-D0 黄金样板定形）

> **版本**：v1.0 ｜ **定形日期**：2026-06-10 ｜ **维护**：仗键天涯(daxing) + Claude Code
>
> 本文档固化 M3-D0 手写黄金样板（role / menu 两页）沉淀的三类配置范式，
> 是 **M3-D1 前端生成器的复刻依据**：生成器从后端模块元数据
> （list / search / required / sensitive + relationEndpoints，见 ADR-10）映射产出这三份配置。
> 类型权威定义见 `src/components/XTable/types.ts` 与 `src/components/XFormDrawer/types.ts`，
> 本文与代码冲突时以代码为准。

---

## 1. 总体形态

一个 CRUD 页面 = **一份 XTable config + 一份 XFormDrawer config（+ 模块特化弹窗）**：

```vue
<el-card shadow="never">
  <XTable ref="tableRef" :config="config" @action="onAction" />
</el-card>
<XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()" />
<!-- role 专有 -->
<AssignMenuDialog v-model="assignVisible" :role-id="assignRoleId" :role-name="assignRoleName" />
```

页面脚本只做三件事：声明配置、装配 api 槽位、`onAction` 路由动作（create/edit/assign…）。
**字段一律来自配置，不允许在模板里硬编码列/表单项**——这是 D1 能"填配置"复刻的前提。

## 2. XTable 配置 schema（`XTableConfig`）

```ts
const config: XTableConfig = {
  api,                       // 模块 API 槽位：{ list, save, update, remove, status }
  rowKey: 'id',              // 默认 'id'
  tree: false,               // ★ true = 树形 table：list 返回整树、无分页（menu 页）
  childrenKey: 'children',   // 树形子节点字段，默认 children
  defaultExpandAll: true,    // 树形默认展开
  search: [                  // 顶部搜索表单（与后端 list 过滤参数对齐）
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '名称/标识模糊查询' },
    { prop: 'status',  label: '状态',   type: 'select', dict: 'sys_normal_disable', width: 160 },
  ],
  columns: [                 // 表格列
    { prop: 'name',       label: '角色名称', minWidth: 120 },
    { prop: 'data_scope', label: '数据范围', type: 'dictTag', options: DATA_SCOPE_OPTIONS },
    { prop: 'status',     label: '状态',    type: 'switch', perm: 'system:role:update' },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:role:create', label: '新增角色' } },
  rowActions: [              // 操作列按钮
    { label: '编辑',     emit: 'edit',   perm: 'system:role:update' },
    { label: '分配菜单', emit: 'assign', perm: 'system:role:update', show: (r) => r.code !== 'super_admin' },
    { label: '删除',     emit: 'remove', perm: 'system:role:delete', type: 'danger', confirm: true },
  ],
  actionsWidth: 180,
  pageSize: 15,              // 对接后端 §6.3：page≥1 / page_size 默认 15 / 上限 100
}
```

约定要点：

- **列 type**：`text`（默认）/ `dictTag`（dict 或静态 options 翻译为 el-tag，`list_class → tagType`）/
  `time` / `switch`（内建调 `api.status`，失败回滚行值；`perm` 缺失时禁用不隐藏）/ `slot`（具名插槽逃生口）。
- **搜索控件 type**：`input` / `select`（`dict` 引用 M2-A 字典或静态 `options`）/ `daterange`。
  空值（''/null/空数组）不参与请求参数。
- **dict 取数**：`useDict(type)` 组合式函数，调 `GET /admin/v1/dicts/type/:type`，模块级内存缓存
  （同类型整会话取一次；字典 value 为字符串，dictTag 匹配统一 `String()` 比较）。
- **权限**：toolbar / rowActions 按钮全部挂 `v-permission`（复用 M1-D 指令，无权限从 DOM 移除）；
  switch 列用 `store.hasPerm` 判禁用。
- **动作流转**：`emit:'remove'` 且配置了 `api.remove` 时由 XTable 内建处理
  （确认 → 删除 → 提示 → 刷新，平铺末行删除自动回退页码）；其余动作经
  `@action="(name, row)"` 抛给页面。`confirm: true` 用默认文案，传字符串自定义。
- **行级显隐**：`show: (row) => boolean`（如 super_admin 行隐藏删除/分配入口）。
- **树形（tree:true）**：api.list 取整树（如 `GET menus/tree`），row-key + tree-props 缩进展开，不渲染分页。
- 组件暴露 `reload(reset?)` 供页面在抽屉/弹窗成功后刷新。

## 3. 编辑表单 schema（`XFormDrawerConfig`，ElDrawer）

```ts
const formConfig: XFormDrawerConfig = {
  entity: '角色',            // 抽屉标题 = 新增/编辑 + entity
  api,                       // 复用同一份 api 槽位：save 对接 sceneCreate、update 对接 sceneUpdate
  detail: getRole,           // 可选：编辑回显走 detail 聚合（行数据缺 dept_ids 时）
  items: [
    { prop: 'name',   label: '角色名称', type: 'input', required: true },
    { prop: 'code',   label: '角色标识', type: 'input', required: true, disabledOnEdit: true, tip: '…' },
    { prop: 'data_scope', label: '数据范围', type: 'select', options: DATA_SCOPE_OPTIONS, defaultValue: 1 },
    { prop: 'dept_ids', label: '自定义部门', type: 'treeSelect', multiple: true, checkStrictly: true,
      treeData: async () => (await getDeptTree()).data, treeProps: { label: 'name' },
      visible: (form, mode) => mode === 'update' && Number(form.data_scope) === 5 },
    { prop: 'sort',   label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}
```

约定要点：

- **控件 type 清单**：`input` / `textarea` / `select`（dict 或静态 options）/ `switch` /
  `number` / `radio` / `treeSelect`（multiple / checkStrictly / treeData 异步取数 / treeProps 映射，节点值固定取 id）。
- **场景复用**：`open('create')` 全默认值（可传 preset 预填，如「新增下级」预置 parent_id）；
  `open('update', row)` 行数据回显，配置 `detail` 则按详情聚合回显。
  required 对接后端 `sceneCreate` 必填；update 提交对接 `sceneUpdate` 选择性更新。
- **提交 payload 收口**：仅可见项参与提交；`disabledOnEdit` 项 update 时不提交
  （配合后端 `$request->has()`）；隐藏字段不提交，后端 normalizeByType 兜底。
- **条件联动**：`visible: (form, mode) => boolean`——不可见项不渲染、不校验、不提交。
- **treeSelect 懒加载**：项首次可见时才调 treeData（避免无权限模块取数 403 噪音）；每次打开抽屉重新拉取。
- **错误回显**：后端 400/422 校验消息由 axios 拦截器统一弹出，抽屉保持打开供修正。

## 4. 分配菜单弹窗范式（role 专有，对接 relationEndpoints）

`src/views/system/role/AssignMenuDialog.vue`：ElDialog + ElTree。

- ElTree：`show-checkbox` + `node-key="id"` + `check-strictly`（独立勾选）+ `default-expand-all`，
  label 取 `title`。
- 流程：打开 → `Promise.all(GET menus/tree, GET roles/:id/menus)` → `setCheckedKeys(menuIds)` 回显
  → 用户勾选 → `getCheckedKeys()` → `PUT roles/:id/menus { menu_ids }` 覆盖提交。
- **独立勾选语义**：提交精确 id 集合、不做父子级联；后端 profile 取数自动补全祖先目录保证树连通（基线 §7），二者配合自洽。
- 非法 menu_id 后端整单回滚（422），不留半套 casbin 策略。
- 已知边界：全不勾提交 `menu_ids: []` 被后端 require 拦为 422「menu_ids不能为空」（清空授权需后端放宽，暂以后端口径为准）。

## 5. 进阶范式（模块特化，D1 复刻边界后议）

| 特化 | 实现 | 标注 |
|---|---|---|
| role `data_scope` 五档（ADR-9） | 静态 options（1全部/2本部门/3本部门及以下/4仅本人/5自定义）；=5 时 `dept_ids` 部门树多选展开，并入 `PUT roles/:id { data_scope, dept_ids }`。后端 sceneCreate 不收 dept_ids，故该项仅编辑场景可见 | role 专有 |
| menu `type` 联动 | 目录/菜单/按钮 radio 切换字段显隐：目录/菜单显 name/path/icon/visible，菜单显 component，按钮仅显 perms（必填）。隐藏字段不提交，后端 normalizeByType 兜底 | menu 专有 |
| 行内「新增下级」 | rowAction `addChild` → `open('create', { parent_id: row.id })` 预填 | 树形模块通用 |

基础配置化范式（§2/§3 全量字段）是 D1 生成器**必须**复刻面；上表联动通过
`visible(form, mode)` 一个钩子表达，D1 是否生成、生成到什么粒度，留 D1 设计定。

## 6. 对 M3-D1 的元数据映射建议

| 后端元数据（ADR-10 / M3-C） | 前端配置落点 |
|---|---|
| 字段 `list` 属性 | `columns[]`（状态枚举 → dictTag + dict） |
| 字段 `search` 属性 | `search[]`（文本 → input/keyword，枚举 → select+dict，时间 → daterange） |
| 字段 `required` | `items[].required`（对接 sceneCreate） |
| 字段 `unique`（code 类） | `items[].disabledOnEdit: true` |
| `isTree/parentField` | `tree: true` + parent_id treeSelect（虚拟根 id=0「顶级」+ 过滤叶子类型） |
| perms 前缀（`system:模块:动作`） | toolbar/rowActions/switch 列的 `perm` |
| `relationEndpoints`（GET/PUT /:id/rel） | 分配弹窗（read 回显 + write 覆盖提交）+ rowAction `assign` |
| `protectedRows` | rowActions `show: (row) => …` 行级隐藏 |
| 模块 API 调用文件 | api 槽位 `{ list, save, update, remove, status, relation }`（D0 手写 axios，D1 对接 OpenAPI 工具链产物，槽位签名不变） |
