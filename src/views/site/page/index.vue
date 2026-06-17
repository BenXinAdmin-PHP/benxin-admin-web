<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   页面管理列表（列出 bx_page / 新建 / 删除 / 状态切换 / 进入搭建器，M6-C）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-17
  +----------------------------------------------------------------------
  最小管理：XTable 列表 + XFormDrawer 新建弹窗（slug/title/status，注入起始 hero 块）。
  内容编辑走「编辑」进搭建器 builder（消费 M6-B 详情/整页 PUT）；状态开关复用 PUT 选择性更新。
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import { createPage, deletePage, listPages, updatePage } from '@/api/page'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

const router = useRouter()

const STATUS_OPTIONS: OptionItem[] = [
  { label: '草稿', value: 0, tagType: 'info' },
  { label: '已发布', value: 1, tagType: 'success' },
]

/** 新建：注入一个合法的起始 hero 块（必填 i18n 给占位中文，过后端 validateBlocks），
 *  内容随后在搭建器细编。slug/title/status 由抽屉收集。 */
function wrappedCreate(data: Record<string, unknown>) {
  const title = String(data.title ?? '新页面')
  const starterHero = {
    type: 'hero',
    eyebrow: { zh: '标签文字', en: '' },
    title: { zh: title, en: '' },
    subtitle: { zh: '副标题，请进入搭建器编辑', en: '' },
    ctaPrimary: { text: { zh: '了解更多', en: '' }, href: '' },
    ctaSecondary: { text: { zh: '联系我们', en: '' }, href: '' },
  }
  return createPage({ ...data, blocks: [starterHero] })
}

const api = {
  list: listPages,
  save: wrappedCreate,
  update: updatePage,
  remove: deletePage,
  // 状态开关：PUT 选择性更新（仅 status 参与，blocks 不提交故不触发深校验）
  status: (id: number, status: number) => updatePage(id, { status }),
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [{ prop: 'keyword', label: '关键词', type: 'input', placeholder: '页面名/标识 slug' }],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'slug', label: '页面标识', width: 180, showOverflowTooltip: true },
    { prop: 'title', label: '页面名', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      type: 'switch',
      perm: 'system:page:save',
      activeValue: 1,
      inactiveValue: 0,
      width: 110,
    },
    { prop: 'updated_at', label: '更新时间', type: 'time', width: 180 },
  ],
  toolbar: { create: { perm: 'system:page:save', label: '新建页面' } },
  rowActions: [
    { label: '编辑', emit: 'builder', perm: 'system:page:list' },
    { label: '删除', emit: 'remove', perm: 'system:page:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '页面',
  api,
  items: [
    {
      prop: 'slug',
      label: '页面标识',
      type: 'input',
      required: true,
      requiredMessage: '请输入页面标识 slug',
      tip: '唯一，仅小写字母/数字/连字符（如 home、about-us），创建后用于渲染路由',
    },
    { prop: 'title', label: '页面名', type: 'input', required: true },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      options: STATUS_OPTIONS,
      defaultValue: 0,
      tip: '仅「已发布」会被官网渲染接口返回，草稿不可取',
    },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'builder' && row) {
    router.push({ path: '/site/page/builder', query: { id: row.id } })
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction" />
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()" />
</template>
