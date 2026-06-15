<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   素材库（分类树筛选 + 双视图列表 + 多模式上传 + 媒体预览 + 批量删 + 重命名/改分类）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-15
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Files, Headset, Picture, VideoCamera } from '@element-plus/icons-vue'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import XResourceUpload from '@/components/XResourceUpload/index.vue'
import XMediaPreview from '@/components/XMediaPreview/index.vue'
import AuthImg from '@/components/XUpload/AuthImg.vue'
import {
  MEDIA_TYPE_OPTIONS,
  TRANSCODE_STATUS,
  batchDeleteResources,
  deleteResource,
  humanSize,
  listResources,
  updateResource,
  type ResourceItem,
} from '@/api/resource'
import { getResourceCategoryTree, type ResourceCategoryItem } from '@/api/resourceCategory'
import type { Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

// ---------------- 左侧分类树（筛选） ----------------
const categories = ref<ResourceCategoryItem[]>([])
const currentCategory = ref<number>(-1) // -1 全部 / 0 未分类 / >0 指定分类

const categoryTree = computed(() => [
  { id: -1, name: '全部素材' },
  { id: 0, name: '未分类' },
  ...categories.value,
])

async function loadCategories() {
  const { data } = await getResourceCategoryTree()
  categories.value = data
}
loadCategories()

function onCategoryClick(node: { id: number }) {
  currentCategory.value = node.id
  tableRef.value?.clearSelection?.()
  tableRef.value?.reload(true)
}

// ---------------- 列表（注入分类筛选） ----------------
function listWithCategory(params: Record<string, unknown>) {
  const extra = currentCategory.value >= 0 ? { category_id: currentCategory.value } : {}
  return listResources({ ...params, ...extra })
}

const config: XTableConfig = {
  api: { list: listWithCategory, remove: deleteResource },
  rowKey: 'id',
  selection: true,
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '素材名称' },
    { prop: 'media_type', label: '类型', type: 'select', options: MEDIA_TYPE_OPTIONS, width: 130 },
  ],
  columns: [
    { prop: 'preview', label: '预览', type: 'slot', width: 80, align: 'center' },
    { prop: 'name', label: '素材名', minWidth: 200, showOverflowTooltip: true },
    { prop: 'media_type', label: '类型', type: 'dictTag', options: MEDIA_TYPE_OPTIONS, width: 90, align: 'center' },
    { prop: 'size', label: '大小', type: 'slot', width: 100, align: 'right' },
    { prop: 'storage', label: '存储', type: 'slot', width: 90, align: 'center' },
    { prop: 'transcode_status', label: '转码', type: 'slot', width: 90, align: 'center' },
    { prop: 'created_at', label: '上传时间', type: 'time', sortable: true, width: 170 },
  ],
  rowActions: [
    { label: '预览', emit: 'preview', perm: 'system:resource:list' },
    { label: '重命名', emit: 'edit', perm: 'system:resource:update' },
    { label: '删除', emit: 'remove', perm: 'system:resource:delete', type: 'danger', confirm: true },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

// ---------------- 多选 + 批量删 ----------------
const selectedRows = ref<Row[]>([])
function onSelectionChange(rows: Row[]) {
  selectedRows.value = rows
}

async function onBatchDelete() {
  const ids = selectedRows.value.map((r) => Number(r.id))
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个素材吗？`, '批量删除', { type: 'warning' })
  } catch {
    return
  }
  try {
    const { data } = await batchDeleteResources(ids)
    const failed = data.physical_failed?.length ?? 0
    ElMessage.success(failed > 0 ? `已删 ${data.deleted} 条，其中 ${failed} 条物理文件待 GC` : `已删除 ${data.deleted} 条`)
    selectedRows.value = []
    tableRef.value?.clearSelection?.()
    tableRef.value?.reload()
  } catch {
    // 拦截器已提示
  }
}

// ---------------- 预览 ----------------
const previewVisible = ref(false)
const previewItem = ref<ResourceItem | null>(null)

// ---------------- 重命名 / 改分类（XFormDrawer 复用，仅 update） ----------------
async function categoryFormTree(): Promise<Row[]> {
  const { data } = await getResourceCategoryTree()
  return [{ id: 0, name: '未分类', children: data }]
}

const formConfig: XFormDrawerConfig = {
  entity: '素材',
  api: {
    // 素材经上传创建，表单仅用于 update（重命名/改分类）；save 不会被触发
    save: () => Promise.reject(new Error('素材通过上传创建，不支持表单新增')),
    update: updateResource,
  },
  items: [
    { prop: 'name', label: '素材名', type: 'input', required: true },
    {
      prop: 'category_id',
      label: '所属分类',
      type: 'treeSelect',
      treeProps: { label: 'name' },
      checkStrictly: true,
      treeData: categoryFormTree,
      defaultValue: 0,
    },
  ],
}

function onAction(name: string, row: Row | null) {
  if (name === 'preview' && row) {
    previewItem.value = row as ResourceItem
    previewVisible.value = true
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  }
}

// ---------------- 预览列：缩略图 / 类型图标 ----------------
const TYPE_ICON: Record<string, unknown> = {
  image: Picture,
  video: VideoCamera,
  audio: Headset,
  document: Document,
  archive: Files,
}
const STORAGE_LABEL: Record<string, string> = {
  local: '本地',
  qiniu: '七牛',
  oss: '阿里OSS',
  vod_tx: '腾讯VOD',
}
</script>

<template>
  <div class="bx-resource">
    <!-- 左：分类树筛选 -->
    <el-card shadow="never" class="bx-resource__aside">
      <div class="bx-resource__aside-title">素材分类</div>
      <el-tree
        :data="categoryTree"
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        :current-node-key="currentCategory"
        :expand-on-click-node="false"
        default-expand-all
        highlight-current
        @node-click="onCategoryClick"
      />
    </el-card>

    <!-- 右：资源列表 -->
    <el-card shadow="never" class="bx-resource__main">
      <XTable ref="tableRef" :config="config" @action="onAction" @selection-change="onSelectionChange">
        <!-- 工具栏：上传 + 批量删 -->
        <template #toolbar>
          <XResourceUpload
            v-permission="'system:resource:upload'"
            :category-id="currentCategory > 0 ? currentCategory : 0"
            @success="tableRef?.reload()"
          />
          <el-button
            v-permission="'system:resource:delete'"
            type="danger"
            plain
            :disabled="!selectedRows.length"
            @click="onBatchDelete"
          >
            批量删除{{ selectedRows.length ? `（${selectedRows.length}）` : '' }}
          </el-button>
        </template>

        <!-- 预览缩略图 / 类型图标 -->
        <template #preview="{ row }">
          <AuthImg v-if="row.media_type === 'image'" :src="row.url" :height="40" />
          <el-icon v-else :size="22" class="bx-resource__type-icon">
            <component :is="TYPE_ICON[row.media_type] ?? Files" />
          </el-icon>
        </template>

        <!-- 大小 -->
        <template #size="{ row }">{{ humanSize(row.size) }}</template>

        <!-- 存储驱动 -->
        <template #storage="{ row }">
          <el-tag size="small" disable-transitions>{{ STORAGE_LABEL[row.storage] ?? row.storage }}</el-tag>
        </template>

        <!-- 转码态（仅 VOD 有意义） -->
        <template #transcode_status="{ row }">
          <el-tag
            v-if="row.storage === 'vod_tx'"
            size="small"
            :type="(TRANSCODE_STATUS[row.transcode_status]?.tagType as never) ?? 'info'"
            disable-transitions
          >
            {{ TRANSCODE_STATUS[row.transcode_status]?.label ?? '—' }}
          </el-tag>
          <span v-else class="text-[var(--bx-text-tertiary)]">—</span>
        </template>
      </XTable>
    </el-card>

    <!-- 媒体预览弹窗 -->
    <XMediaPreview v-model="previewVisible" :item="previewItem" />

    <!-- 重命名 / 改分类 -->
    <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()" />
  </div>
</template>

<style scoped>
.bx-resource {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.bx-resource__aside {
  width: 220px;
  flex-shrink: 0;
}
.bx-resource__aside-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--bx-text-primary);
}
.bx-resource__main {
  flex: 1;
  min-width: 0;
}
.bx-resource__type-icon {
  color: var(--bx-text-secondary);
}
</style>
