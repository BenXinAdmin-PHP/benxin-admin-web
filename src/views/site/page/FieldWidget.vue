<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   搭建器右栏字段控件（BLOCK_FORM_SCHEMA 驱动，递归渲染 object/数组）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-17
  +----------------------------------------------------------------------
  i18n 字段跟随顶部「中/英」语言 Tab（注入 builderEditLang）按语言录入，落 {zh,en}。
  数组型（i18n-list/object-list）支持增删 + vue-draggable-plus 拖拽重排子项。
  object/object-list 递归本组件渲染 subFields，加新块类型时表单零改（单源驱动）。
-->
<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Delete, Plus, Rank } from '@element-plus/icons-vue'
import { buildObject, type FieldDef, type I18nValue } from './blockSchema'

defineOptions({ name: 'FieldWidget' })

defineProps<{ field: FieldDef }>()
// 控件值：i18n→{zh,en}、text→string、列表→数组、object→对象（由归一保证结构）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = defineModel<any>({ required: true })

/** 当前录入语言（顶部 Tab 注入）。inject 结果编译器不识别为 ref、模板不自动解包，
 *  故包一层 computed（编译器识别 ref → 模板解包为 'zh'|'en'）供作字段键与判断用。 */
const injectedLang = inject<Ref<'zh' | 'en'>>('builderEditLang')!
const langKey = computed(() => injectedLang.value)

function addI18nItem() {
  ;(model.value as I18nValue[]).push({ zh: '', en: '' })
}
function addObjectItem(subFields: FieldDef[]) {
  ;(model.value as Record<string, unknown>[]).push(buildObject(subFields))
}
function removeItem(idx: number) {
  ;(model.value as unknown[]).splice(idx, 1)
}
</script>

<template>
  <!-- ===== i18n 单/多行：按当前语言录入 ===== -->
  <template v-if="field.widget === 'i18n-text' || field.widget === 'i18n-textarea'">
    <el-input
      v-model="model[langKey]"
      :type="field.widget === 'i18n-textarea' ? 'textarea' : 'text'"
      :rows="3"
      :placeholder="langKey === 'zh' ? field.placeholder || '请输入中文' : '可空，留空渲染回退中文'"
    />
    <div v-if="field.required && langKey === 'zh'" class="bx-field-tip">中文必填</div>
  </template>

  <!-- ===== 纯文本：options 存在用下拉，否则单/多行 ===== -->
  <template v-else-if="field.widget === 'text' || field.widget === 'textarea'">
    <el-select
      v-if="field.options"
      v-model="model"
      clearable
      :placeholder="field.placeholder || '请选择'"
      class="bx-w-full"
    >
      <el-option v-for="o in field.options" :key="o.value" :label="o.label" :value="o.value" />
    </el-select>
    <el-input
      v-else
      v-model="model"
      :type="field.widget === 'textarea' ? 'textarea' : 'text'"
      :rows="3"
      :placeholder="field.placeholder || '选填'"
    />
  </template>

  <!-- ===== object：递归渲染子字段 ===== -->
  <template v-else-if="field.widget === 'object'">
    <div class="bx-object">
      <el-form-item
        v-for="sf in field.subFields"
        :key="sf.key"
        :label="sf.label"
        label-width="84px"
        class="bx-sub-item"
      >
        <FieldWidget v-model="model[sf.key]" :field="sf" />
      </el-form-item>
    </div>
  </template>

  <!-- ===== i18n-list：i18n 字符串数组（增删 + 拖排） ===== -->
  <template v-else-if="field.widget === 'i18n-list'">
    <VueDraggable v-model="model" handle=".bx-row-drag" :animation="150" class="bx-list">
      <div v-for="(item, i) in model" :key="i" class="bx-list-row">
        <el-icon class="bx-row-drag"><Rank /></el-icon>
        <el-input
          v-model="item[langKey]"
          :placeholder="langKey === 'zh' ? '中文（必填）' : '英文（可空）'"
        />
        <el-button text type="danger" :icon="Delete" @click="removeItem(Number(i))" />
      </div>
    </VueDraggable>
    <el-button text type="primary" :icon="Plus" @click="addI18nItem">添加一项</el-button>
  </template>

  <!-- ===== object-list：对象数组（每项按 subFields，增删 + 拖排） ===== -->
  <template v-else-if="field.widget === 'object-list'">
    <VueDraggable v-model="model" handle=".bx-card-drag" :animation="150" class="bx-list">
      <div v-for="(item, i) in model" :key="i" class="bx-item-card">
        <div class="bx-item-head">
          <el-icon class="bx-card-drag"><Rank /></el-icon>
          <span class="bx-item-no">#{{ Number(i) + 1 }}</span>
          <el-button text type="danger" size="small" :icon="Delete" @click="removeItem(Number(i))">
            删除
          </el-button>
        </div>
        <el-form-item
          v-for="sf in field.subFields"
          :key="sf.key"
          :label="sf.label"
          label-width="84px"
          class="bx-sub-item"
        >
          <FieldWidget v-model="item[sf.key]" :field="sf" />
        </el-form-item>
      </div>
    </VueDraggable>
    <el-button text type="primary" :icon="Plus" @click="addObjectItem(field.subFields ?? [])">
      添加子项
    </el-button>
  </template>
</template>

<style scoped>
.bx-field-tip {
  margin-top: 2px;
  font-size: 12px;
  color: var(--bx-text-tertiary);
}
.bx-w-full {
  width: 100%;
}
.bx-object {
  width: 100%;
  padding: 8px 10px;
  border: 1px dashed var(--bx-border);
  border-radius: var(--bx-control-radius);
  background: var(--bx-page-bg);
}
.bx-sub-item {
  margin-bottom: 10px;
}
.bx-sub-item:last-child {
  margin-bottom: 0;
}
.bx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.bx-list-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bx-item-card {
  padding: 10px;
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-control-radius);
  background: var(--bx-page-bg);
}
.bx-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.bx-item-no {
  flex: 1;
  font-size: 13px;
  color: var(--bx-text-secondary);
}
.bx-row-drag,
.bx-card-drag {
  cursor: grab;
  color: var(--bx-text-tertiary);
}
.bx-row-drag:active,
.bx-card-drag:active {
  cursor: grabbing;
}
</style>
