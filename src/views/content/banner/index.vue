<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   广告位管理（bx:make 生成：XTable 配置化列表 + 编辑抽屉）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-12
  | @updated   2026-06-12（手工槽接线：image XUpload/AuthImg + 生效区间 daterange 搜索）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import XUpload from '@/components/XUpload/index.vue'
import AuthImg from '@/components/XUpload/AuthImg.vue'
import {
  createBanner,
  deleteBanner,
  listBanners,
  setBannerStatus,
  updateBanner,
} from '@/api/banner'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'


const api = {
  list: listBanners,
  save: createBanner,
  update: updateBanner,
  remove: deleteBanner,
  status: setBannerStatus,
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '标题/位置模糊查询' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', width: 160 },
    // ★ 手工槽（生成器缺口·回炉候选 search daterange）：与所选区间「有交集」的广告，
    // 后端 BannerService 按 start_at/end_at 空值=立即生效/长期有效 语义过滤
    { prop: 'effective', label: '生效时间', type: 'daterange' },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'title', label: '标题', minWidth: 160, showOverflowTooltip: true },
    { prop: 'image', label: '图片', type: 'slot', width: 110, align: 'center' },
    { prop: 'position', label: '位置', width: 120 },
    { prop: 'status', label: '状态', type: 'switch', perm: 'content:banner:update', width: 80 },
    { prop: 'start_at', label: '生效开始', type: 'time', width: 170 },
    { prop: 'end_at', label: '生效结束', type: 'time', width: 170 },
    { prop: 'sort', label: '排序', width: 70, align: 'center' },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'content:banner:create', label: '新增广告位' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'content:banner:update' },
    { label: '删除', emit: 'remove', perm: 'content:banner:delete', type: 'danger', confirm: true },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '广告位',
  api,
  items: [
    { prop: 'title', label: '标题', type: 'input', required: true },
    // ★ 手工槽（生成器缺口·回炉候选 image:true）：XUpload 单图，url 回填 image 字段
    { prop: 'image', label: '图片', type: 'slot', required: true, requiredMessage: '请上传图片' },
    { prop: 'link', label: '跳转链接', type: 'textarea', tip: '点击跳转地址，可空' },
    { prop: 'position', label: '位置', type: 'input', required: true, tip: '广告位分组标识，如 home_top' },
    { prop: 'sort', label: '排序', type: 'number', min: 0, defaultValue: 0 },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'start_at', label: '生效开始', type: 'datetime', tip: '可空；为空表示立即生效' },
    { prop: 'end_at', label: '生效结束', type: 'datetime', tip: '可空；为空表示长期有效' },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction">
      <!-- ★ 手工槽：图片列受控预览（本地驱动鉴权取流，点击大图） -->
      <template #image="{ row }">
        <AuthImg :src="row.image" />
      </template>
    </XTable>
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()">
    <!-- ★ 手工槽：广告图上传（XUpload 单图，消费 M2-D 文件通道） -->
    <template #image="{ form, disabled }">
      <XUpload v-model="form.image" :disabled="disabled" />
    </template>
  </XFormDrawer>
</template>
