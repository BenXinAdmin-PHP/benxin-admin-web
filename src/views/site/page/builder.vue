<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   页面拖拽搭建器（三栏：块面板/画布排序/字段表单，M6-C / ADR-22）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-17
  +----------------------------------------------------------------------
  消费 M6-B admin system:page:* 接口：进入 GET 详情载入原始 blocks，整页 PUT 保存。
  左=块类型面板、中=画布纵向区块流（vue-draggable-plus 排序 + 上移/下移/复制/删除/选中）、
  右=BLOCK_FORM_SCHEMA 驱动字段表单（i18n 中/英 Tab 落 {zh,en}）。保存语义：整 blocks 数组
  PUT，后端 validateBlocks 权威校验，失败 422 由 request 拦截器如实弹后端 msg（不假成功）。
-->
<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Back, CopyDocument, Delete, Rank } from '@element-plus/icons-vue'
import * as EpIcons from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { getPage, updatePage, type Block } from '@/api/page'
import {
  BLOCK_FORM_SCHEMA,
  BLOCK_LABELS,
  BLOCK_TYPES,
  createEmptyBlock,
  normalizeBlocksForEdit,
  serializeBlocksForSave,
} from './blockSchema'
import FieldWidget from './FieldWidget.vue'
import BlockPreview from './BlockPreview.vue'
import { useUserStore } from '@/stores/user'

defineOptions({ name: 'SitePageBuilder' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageId = Number(route.query.id)
const canSave = computed(() => userStore.hasPerm('system:page:save'))

// ---- 页面态 ----
const pageSlug = ref('')
const pageTitle = ref('')
const pageStatus = ref<number>(0)
const blocks = ref<Block[]>([])
// 选中块按「对象引用」跟踪（非索引）：拖拽重排后引用不变，高亮与右栏表单不错位
const selectedBlock = ref<Block | null>(null)
const loading = ref(true)
const saving = ref(false)
const dirty = ref(false)
const isLoaded = ref(false)

// 右栏录入语言 / 画布预览语言（独立，§5.3 + §6）
const editLang = ref<'zh' | 'en'>('zh')
const previewLang = ref<'zh' | 'en'>('zh')
provide('builderEditLang', editLang)

const selectedFields = computed(() =>
  selectedBlock.value ? BLOCK_FORM_SCHEMA[selectedBlock.value.type] ?? [] : [],
)

/** 左栏块图标（@element-plus/icons-vue 组件名 → 组件） */
function iconOf(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (EpIcons as any)[name]
}

// ---- 载入 ----
async function load() {
  if (!Number.isInteger(pageId) || pageId <= 0) {
    ElMessage.error('缺少有效的页面 id')
    router.replace('/site/page')
    return
  }
  loading.value = true
  try {
    const { data } = await getPage(pageId)
    pageSlug.value = data.slug
    pageTitle.value = data.title
    pageStatus.value = data.status
    blocks.value = normalizeBlocksForEdit(data.blocks ?? [])
    selectedBlock.value = blocks.value[0] ?? null
    isLoaded.value = true
  } catch {
    // 拦截器已弹错误；详情失败回列表
    router.replace('/site/page')
  } finally {
    loading.value = false
  }
}
load()

// 任意编辑标脏（载入后才生效，避免初始赋值误标）
watch(
  [blocks, pageTitle, pageStatus],
  () => {
    if (isLoaded.value) dirty.value = true
  },
  { deep: true },
)

// ---- 块操作（按 v-for 索引执行；选中态按对象引用，拖拽后不错位） ----
function addBlock(type: string) {
  const blk = createEmptyBlock(type)
  blocks.value.push(blk)
  selectedBlock.value = blk
}
function selectBlock(blk: Block) {
  selectedBlock.value = blk
}
function moveUp(i: number) {
  if (i <= 0) return
  const arr = blocks.value
  const tmp = arr[i]!
  arr[i] = arr[i - 1]!
  arr[i - 1] = tmp
}
function moveDown(i: number) {
  if (i >= blocks.value.length - 1) return
  const arr = blocks.value
  const tmp = arr[i]!
  arr[i] = arr[i + 1]!
  arr[i + 1] = tmp
}
function duplicateBlock(i: number) {
  const copy = JSON.parse(JSON.stringify(blocks.value[i])) as Block
  blocks.value.splice(i + 1, 0, copy)
  selectedBlock.value = copy
}
function removeBlock(i: number) {
  const removed = blocks.value[i]
  blocks.value.splice(i, 1)
  if (selectedBlock.value === removed) {
    selectedBlock.value = blocks.value[i] ?? blocks.value[i - 1] ?? null
  }
}

// ---- 保存 ----
async function save() {
  if (!pageTitle.value.trim()) {
    ElMessage.warning('请填写页面名')
    return
  }
  saving.value = true
  try {
    await updatePage(pageId, {
      title: pageTitle.value,
      status: pageStatus.value,
      blocks: serializeBlocksForSave(blocks.value),
    })
    dirty.value = false
    ElMessage.success('保存成功')
  } catch {
    // 422 等失败由 request 拦截器弹后端 msg（定位 block 路径），此处不假成功
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/site/page')
}

// 未保存改动离开提示
onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm('有未保存的改动，确定离开吗？', '提示', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '继续编辑',
    })
    return true
  } catch {
    return false
  }
})
</script>

<template>
  <div v-loading="loading" class="bx-builder">
    <!-- 顶栏 -->
    <div class="bx-topbar">
      <el-button :icon="Back" text @click="goBack">返回列表</el-button>
      <div class="bx-page-meta">
        <el-input v-model="pageTitle" placeholder="页面名" class="bx-title-input" />
        <el-tag type="info" effect="plain">/{{ pageSlug }}</el-tag>
      </div>
      <div class="bx-topbar-right">
        <span class="bx-status-label">{{ pageStatus === 1 ? '已发布' : '草稿' }}</span>
        <el-switch
          v-model="pageStatus"
          :active-value="1"
          :inactive-value="0"
          inline-prompt
          active-text="发布"
          inactive-text="草稿"
        />
        <el-button
          v-if="canSave"
          type="primary"
          :loading="saving"
          @click="save"
        >
          保存页面
        </el-button>
      </div>
    </div>

    <!-- 三栏 -->
    <div class="bx-cols">
      <!-- 左：块类型面板 -->
      <div class="bx-col bx-col-left">
        <div class="bx-col-title">添加区块</div>
        <div class="bx-block-types">
          <button
            v-for="bt in BLOCK_TYPES"
            :key="bt.type"
            class="bx-block-type"
            type="button"
            @click="addBlock(bt.type)"
          >
            <el-icon><component :is="iconOf(bt.icon)" /></el-icon>
            <span>{{ bt.label }}</span>
          </button>
        </div>
      </div>

      <!-- 中：画布 -->
      <div class="bx-col bx-col-canvas">
        <div class="bx-canvas-bar">
          <span class="bx-col-title">画布（{{ blocks.length }} 个区块）</span>
          <div class="bx-canvas-lang">
            <span>预览语言</span>
            <el-radio-group v-model="previewLang" size="small">
              <el-radio-button value="zh">中</el-radio-button>
              <el-radio-button value="en">英</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <el-empty v-if="blocks.length === 0" description="从左侧添加第一个区块" />

        <VueDraggable
          v-else
          v-model="blocks"
          handle=".bx-block-drag"
          :animation="160"
          class="bx-canvas-list"
        >
          <div
            v-for="(blk, i) in blocks"
            :key="i"
            class="bx-canvas-card"
            :class="{ 'is-active': blk === selectedBlock }"
            @click="selectBlock(blk)"
          >
            <div class="bx-card-head">
              <el-icon class="bx-block-drag"><Rank /></el-icon>
              <span class="bx-card-type">{{ BLOCK_LABELS[blk.type] || blk.type }}</span>
              <div class="bx-card-ops" @click.stop>
                <el-button text :icon="ArrowUp" :disabled="i === 0" @click="moveUp(i)" />
                <el-button
                  text
                  :icon="ArrowDown"
                  :disabled="i === blocks.length - 1"
                  @click="moveDown(i)"
                />
                <el-button text :icon="CopyDocument" @click="duplicateBlock(i)" />
                <el-button text type="danger" :icon="Delete" @click="removeBlock(i)" />
              </div>
            </div>
            <div class="bx-card-body">
              <BlockPreview :block="blk" :lang="previewLang" />
            </div>
          </div>
        </VueDraggable>
      </div>

      <!-- 右：字段表单 -->
      <div class="bx-col bx-col-form">
        <template v-if="selectedBlock">
          <div class="bx-col-title">
            {{ BLOCK_LABELS[selectedBlock.type] || selectedBlock.type }} · 字段编辑
          </div>
          <el-tabs v-model="editLang" class="bx-lang-tabs">
            <el-tab-pane label="中文" name="zh" />
            <el-tab-pane label="English" name="en" />
          </el-tabs>
          <el-form label-position="top" class="bx-field-form">
            <el-form-item v-for="f in selectedFields" :key="f.key">
              <template #label>
                <span>{{ f.label }}</span>
                <span v-if="f.required" class="bx-req">*</span>
              </template>
              <FieldWidget v-model="selectedBlock[f.key]" :field="f" />
            </el-form-item>
          </el-form>
        </template>
        <el-empty v-else description="选中一个区块以编辑其字段" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bx-builder {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  min-height: 480px;
}
.bx-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  background: var(--bx-card-bg);
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-card-radius);
  margin-bottom: 10px;
}
.bx-page-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.bx-title-input {
  max-width: 320px;
}
.bx-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bx-status-label {
  font-size: 13px;
  color: var(--bx-text-secondary);
}
.bx-cols {
  display: flex;
  gap: 10px;
  flex: 1;
  min-height: 0;
}
.bx-col {
  background: var(--bx-card-bg);
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-card-radius);
  padding: 12px;
  overflow-y: auto;
}
.bx-col-left {
  width: 184px;
  flex-shrink: 0;
}
.bx-col-canvas {
  flex: 1;
  min-width: 0;
}
.bx-col-form {
  width: 380px;
  flex-shrink: 0;
}
.bx-col-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--bx-text-primary);
  margin-bottom: 12px;
}
.bx-block-types {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bx-block-type {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-control-radius);
  background: var(--bx-page-bg);
  color: var(--bx-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.bx-block-type:hover {
  border-color: var(--bx-color-primary);
  color: var(--bx-color-primary);
}
.bx-canvas-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.bx-canvas-lang {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--bx-text-secondary);
}
.bx-canvas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bx-canvas-card {
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-control-radius);
  background: var(--bx-card-bg);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.bx-canvas-card.is-active {
  border-color: var(--bx-color-primary);
  box-shadow: 0 0 0 1px var(--bx-color-primary);
}
.bx-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--bx-border);
  background: var(--bx-table-header-bg);
  border-radius: var(--bx-control-radius) var(--bx-control-radius) 0 0;
}
.bx-card-type {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--bx-text-secondary);
}
.bx-card-ops {
  display: flex;
  gap: 2px;
}
.bx-block-drag {
  cursor: grab;
  color: var(--bx-text-tertiary);
}
.bx-block-drag:active {
  cursor: grabbing;
}
.bx-card-body {
  padding: 12px 14px;
}
.bx-lang-tabs {
  margin-bottom: 4px;
}
.bx-field-form :deep(.el-form-item__label) {
  padding-bottom: 2px;
}
.bx-req {
  color: var(--el-color-danger);
  margin-left: 2px;
}
</style>
