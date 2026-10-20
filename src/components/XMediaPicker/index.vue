<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   通用素材库选择器弹窗（左分类树 + 名称搜索 + 列表勾选 + 分页 + 确认回填 URL；配 image|video / 单多选）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-21
  +----------------------------------------------------------------------
  说明：独立通用基建（非富文本专属）。富文本图片/视频、og_image、banner 等均复用本组件「选择」素材。
        全程复用既有素材管理 API（listResources / getResourceCategoryTree），不新增后端。
        缩略图用真实 URL 经 AuthImg 受控渲染（本地驱动鉴权取流 → blob，云直链直显），不复刻参考图字面字符串 bug。
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, VideoCamera } from '@element-plus/icons-vue'
import AuthImg from '@/components/XUpload/AuthImg.vue'
import { humanSize, listResources, type ResourceItem } from '@/api/resource'
import { getResourceCategoryTree, type ResourceCategoryItem } from '@/api/resourceCategory'
import type { MediaPickResult, MediaPickType } from './types'

const props = withDefaults(
  defineProps<{
    /** 过滤并回填的媒体类型：image=图片 / video=视频（默认 image） */
    type?: MediaPickType
    /** 是否多选（默认单选；富文本插图用单选） */
    multiple?: boolean
    /** 弹窗标题（默认按 type 自动「选择图片 / 选择视频」） */
    title?: string
  }>(),
  { type: 'image', multiple: false, title: '' },
)

/** v-model：弹窗显隐 */
const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  /** 确认选择：单选 emit 单个载荷、多选 emit 数组（均为绝对/受控 URL + 元信息，详见 types.ts） */
  confirm: [payload: MediaPickResult | MediaPickResult[]]
}>()

const dialogTitle = computed(
  () => props.title || (props.type === 'video' ? '选择视频' : '选择图片'),
)

// ---------------- 左侧分类树（筛选） ----------------
const categories = ref<ResourceCategoryItem[]>([])
const currentCategory = ref<number>(-1) // -1 全部 / 0 未分类 / >0 指定分类

const categoryTree = computed(() => [
  { id: -1, name: '全部素材' },
  { id: 0, name: '未分类' },
  ...categories.value,
])

async function loadCategories() {
  try {
    const { data } = await getResourceCategoryTree()
    categories.value = data
  } catch {
    // 拦截器已提示
  }
}

function onCategoryClick(node: { id: number }) {
  currentCategory.value = node.id
  page.value = 1
  loadList()
}

// ---------------- 列表（按 type 过滤 + 分类 + 关键词） ----------------
const keyword = ref('')
const page = ref(1)
const pageSize = ref(15)
const total = ref(0)
const loading = ref(false)
const rows = ref<ResourceItem[]>([])

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      page_size: pageSize.value,
      media_type: props.type, // ★按 type 精确过滤（复用后端 media_type 参数）
    }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (currentCategory.value >= 0) params.category_id = currentCategory.value
    const { data } = await listResources(params)
    rows.value = data.list
    total.value = data.total
    clearSelection()
  } catch {
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  loadList()
}

function onReset() {
  keyword.value = ''
  currentCategory.value = -1
  page.value = 1
  loadList()
}

function onPageChange(p: number) {
  page.value = p
  loadList()
}

function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  loadList()
}

// ---------------- 选择（单选 radio / 多选 checkbox） ----------------
const tableRef = ref()
const singleId = ref<number | null>(null) // 单选选中 id
const multiRows = ref<ResourceItem[]>([]) // 多选选中行

function clearSelection() {
  singleId.value = null
  multiRows.value = []
  tableRef.value?.clearSelection?.()
}

function onRowClick(row: ResourceItem) {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection?.(row)
  } else {
    singleId.value = row.id
  }
}

function onSelectionChange(rows: ResourceItem[]) {
  multiRows.value = rows
}

/** 选中行 → 回填载荷（仅取消费方所需字段） */
function toResult(r: ResourceItem): MediaPickResult {
  return {
    id: r.id,
    url: r.url,
    name: r.name,
    media_type: r.media_type,
    size: r.size,
    mime: r.mime,
    ext: r.ext,
    storage: r.storage,
  }
}

const canConfirm = computed(() =>
  props.multiple ? multiRows.value.length > 0 : singleId.value !== null,
)

function onConfirm() {
  if (props.multiple) {
    if (!multiRows.value.length) {
      ElMessage.warning('请至少选择一个素材')
      return
    }
    emit('confirm', multiRows.value.map(toResult))
  } else {
    const row = rows.value.find((r) => r.id === singleId.value)
    if (!row) {
      ElMessage.warning('请选择一个素材')
      return
    }
    emit('confirm', toResult(row))
  }
  visible.value = false
}

function onCancel() {
  visible.value = false
}

// 打开时（含 type 变化后再次打开）：重置筛选并加载
watch(
  visible,
  (v) => {
    if (v) {
      keyword.value = ''
      currentCategory.value = -1
      page.value = 1
      if (!categories.value.length) loadCategories()
      loadList()
    } else {
      clearSelection()
    }
  },
  { immediate: true },
)

const TYPE_ICON = { image: Picture, video: VideoCamera }
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900"
    top="6vh"
    append-to-body
    destroy-on-close
    class="bx-media-picker"
  >
    <div class="bx-mp">
      <!-- 左：分类树筛选 -->
      <div class="bx-mp__aside">
        <div class="bx-mp__aside-title">素材分类</div>
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
      </div>

      <!-- 右：搜索 + 列表 + 分页 -->
      <div class="bx-mp__main">
        <div class="bx-mp__search">
          <el-input
            v-model="keyword"
            placeholder="素材名称"
            clearable
            class="bx-mp__search-input"
            @keyup.enter="onSearch"
            @clear="onSearch"
          />
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
          <!-- 上传入口：选择器只「选」不「传」（守非目标·点6），新素材引导去素材管理页 -->
          <span class="bx-mp__tip">需要新素材？请到「素材管理」上传</span>
        </div>

        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="rows"
          row-key="id"
          height="48vh"
          highlight-current-row
          @row-click="onRowClick"
          @selection-change="onSelectionChange"
        >
          <!-- 多选：勾选框列 / 单选：单选钮列 -->
          <el-table-column v-if="multiple" type="selection" width="46" />
          <el-table-column v-else width="46" align="center">
            <template #default="{ row }">
              <el-radio :model-value="singleId ?? undefined" :value="row.id" @change="singleId = row.id">
                <span />
              </el-radio>
            </template>
          </el-table-column>

          <el-table-column prop="id" label="ID" width="72" align="center" />

          <!-- ★缩略图：真实 URL 经 AuthImg 受控渲染（图片）/ 类型图标（视频） -->
          <el-table-column label="缩略图" width="92" align="center">
            <template #default="{ row }">
              <AuthImg v-if="row.media_type === 'image'" :src="row.url" :height="40" />
              <el-icon v-else :size="22" class="bx-mp__type-icon">
                <component :is="TYPE_ICON[row.media_type as MediaPickType] ?? VideoCamera" />
              </el-icon>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="素材名" min-width="180" show-overflow-tooltip />
          <el-table-column label="大小" width="100" align="right">
            <template #default="{ row }">{{ humanSize(row.size) }}</template>
          </el-table-column>
          <el-table-column prop="media_type" label="类型" width="80" align="center" />
          <el-table-column prop="created_at" label="上传时间" width="170" />
        </el-table>

        <div class="bx-mp__pager">
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[15, 30, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="onCancel">返回</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="onConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.bx-mp {
  display: flex;
  gap: 12px;
  align-items: stretch;
}
.bx-mp__aside {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--bx-border, var(--el-border-color-lighter));
  padding-right: 12px;
  overflow: auto;
}
.bx-mp__aside-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--bx-text-primary, var(--el-text-color-primary));
}
.bx-mp__main {
  flex: 1;
  min-width: 0;
}
.bx-mp__search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.bx-mp__search-input {
  width: 240px;
}
.bx-mp__tip {
  margin-left: auto;
  align-self: center;
  font-size: 12px;
  color: var(--bx-text-tertiary, var(--el-text-color-secondary));
}
.bx-mp__pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.bx-mp__type-icon {
  color: var(--bx-text-secondary, var(--el-text-color-secondary));
}
</style>
