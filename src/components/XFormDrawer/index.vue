<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   XFormDrawer 配置化编辑抽屉（formItems 驱动 + create/update 场景复用 + 条件联动）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-10
  | @updated   2026-06-12（M4-A：datetime 控件 + slot 具名插槽项，承载 XEditor/XUpload 手工槽）
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useDict } from '@/composables/useDict'
import type { OptionItem, Row } from '@/components/XTable/types'
import type { FormItem, FormMode, XFormDrawerConfig } from './types'

const props = defineProps<{ config: XFormDrawerConfig }>()

const emit = defineEmits<{
  /** 提交成功（页面据此刷新列表） */
  success: [mode: FormMode]
}>()

const config = props.config
const rowKey = config.rowKey ?? 'id'

const visible = ref(false)
const mode = ref<FormMode>('create')
const saving = ref(false)
const currentId = ref(0)
const form = reactive<Row>({})
const formRef = ref<FormInstance>()

// ---- 字典选项（select/radio 用；模块级缓存）----
const dictTypes = new Set(config.items.map((it) => it.dict).filter((t): t is string => !!t))
const dictRefs = new Map([...dictTypes].map((t) => [t, useDict(t)]))

function optionsOf(it: FormItem): OptionItem[] {
  if (it.options) {
    return it.options
  }
  if (it.dict) {
    return (dictRefs.get(it.dict)?.value ?? []).map((d) => ({ label: d.label, value: d.value }))
  }
  return []
}

// ---- treeSelect 数据：项首次可见时懒加载（避免无权限模块的取数 403 噪音）----
const treeData = reactive<Record<string, Row[]>>({})
const treeLoading = new Set<string>()

// ---- 条件联动：不可见项不渲染、不校验、不提交 ----
const visibleItems = computed(() =>
  config.items.filter((it) => !it.visible || it.visible(form, mode.value)),
)

watchEffect(() => {
  for (const it of visibleItems.value) {
    if (it.type === 'treeSelect' && it.treeData && !(it.prop in treeData) && !treeLoading.has(it.prop)) {
      treeLoading.add(it.prop)
      it.treeData()
        .then((data) => {
          treeData[it.prop] = data
        })
        .finally(() => treeLoading.delete(it.prop))
    }
  }
})

// ---- 校验规则（required 对接后端 sceneCreate 必填；仅对可见项生效）----
const rules = computed<FormRules>(() => {
  const r: FormRules = {}
  for (const it of visibleItems.value) {
    if (it.required) {
      r[it.prop] = [
        {
          required: true,
          message: it.requiredMessage ?? `请${it.type === 'input' || it.type === 'textarea' ? '输入' : '选择'}${it.label}`,
          trigger: it.type === 'input' || it.type === 'textarea' ? 'blur' : 'change',
        },
      ]
    }
  }
  return r
})

function defaultOf(it: FormItem): unknown {
  if (it.defaultValue !== undefined) {
    return it.defaultValue
  }
  switch (it.type) {
    case 'switch':
      return it.activeValue ?? 1
    case 'number':
      return it.min ?? 0
    case 'treeSelect':
      return it.multiple ? [] : undefined
    case 'datetime':
      return null // 可空 datetime 列：空值提交 null 而非 ''
    default:
      return ''
  }
}

/**
 * 打开抽屉。
 * - open('create')：全默认值；可传 preset 预填（如「新增下级」预置 parent_id）。
 * - open('update', row)：行数据回显；配置了 detail 则按 detail 聚合回显（如 dept_ids）。
 */
async function open(m: FormMode, row?: Row) {
  mode.value = m
  // 重置为默认值
  for (const key of Object.keys(form)) {
    delete form[key]
  }
  for (const it of config.items) {
    form[it.prop] = defaultOf(it)
  }
  // treeSelect 数据每次打开重新拉取（树在 CRUD 后会变化）
  for (const key of Object.keys(treeData)) {
    delete treeData[key]
  }

  let source: Row | undefined = row
  if (m === 'update' && row) {
    currentId.value = Number(row[rowKey])
    if (config.detail) {
      const { data } = await config.detail(currentId.value)
      source = data
    }
  }
  if (source) {
    for (const it of config.items) {
      if (it.prop in source) {
        form[it.prop] = source[it.prop]
      }
    }
  }
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({ open, close })

function isDisabled(it: FormItem): boolean {
  return !!it.disabledOnEdit && mode.value === 'update'
}

/** 提交 payload：仅可见项；update 时跳过 disabledOnEdit（后端 $request->has() 选择性更新） */
function buildPayload(): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const it of visibleItems.value) {
    if (isDisabled(it)) {
      continue
    }
    payload[it.prop] = form[it.prop]
  }
  return payload
}

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    if (mode.value === 'create') {
      await config.api.save(buildPayload())
    } else {
      await config.api.update(currentId.value, buildPayload())
    }
    ElMessage.success(mode.value === 'create' ? '新增成功' : '更新成功')
    visible.value = false
    emit('success', mode.value)
  } catch {
    // 422 业务校验/唯一冲突等已由拦截器弹出消息，抽屉保持打开供修正
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="`${mode === 'create' ? '新增' : '编辑'}${config.entity}`"
    :size="config.width ?? 480"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-width="config.labelWidth ?? '100px'"
    >
      <el-form-item v-for="it in visibleItems" :key="it.prop" :label="it.label" :prop="it.prop">
        <el-input
          v-if="it.type === 'input'"
          v-model="form[it.prop]"
          :placeholder="it.placeholder ?? `请输入${it.label}`"
          :disabled="isDisabled(it)"
          clearable
        />
        <el-input
          v-else-if="it.type === 'textarea'"
          v-model="form[it.prop]"
          type="textarea"
          :rows="3"
          :placeholder="it.placeholder ?? `请输入${it.label}`"
          :disabled="isDisabled(it)"
        />
        <el-select
          v-else-if="it.type === 'select'"
          v-model="form[it.prop]"
          :placeholder="it.placeholder ?? `请选择${it.label}`"
          :disabled="isDisabled(it)"
          class="w-full"
        >
          <el-option
            v-for="o in optionsOf(it)"
            :key="String(o.value)"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
        <el-radio-group
          v-else-if="it.type === 'radio'"
          v-model="form[it.prop]"
          :disabled="isDisabled(it)"
        >
          <el-radio v-for="o in optionsOf(it)" :key="String(o.value)" :value="o.value">
            {{ o.label }}
          </el-radio>
        </el-radio-group>
        <el-switch
          v-else-if="it.type === 'switch'"
          v-model="form[it.prop]"
          :active-value="it.activeValue ?? 1"
          :inactive-value="it.inactiveValue ?? 0"
          :disabled="isDisabled(it)"
        />
        <el-input-number
          v-else-if="it.type === 'number'"
          v-model="form[it.prop]"
          :min="it.min"
          :max="it.max"
          :disabled="isDisabled(it)"
        />
        <el-date-picker
          v-else-if="it.type === 'datetime'"
          v-model="form[it.prop]"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          :placeholder="it.placeholder ?? `请选择${it.label}`"
          :disabled="isDisabled(it)"
          clearable
          class="w-full"
        />
        <!-- 具名插槽项：XEditor/XUpload 等复杂控件由页面提供模板（手工槽范式） -->
        <slot
          v-else-if="it.type === 'slot'"
          :name="it.slot ?? it.prop"
          :form="form"
          :mode="mode"
          :disabled="isDisabled(it)"
        />
        <el-tree-select
          v-else-if="it.type === 'treeSelect'"
          v-model="form[it.prop]"
          :data="treeData[it.prop] ?? []"
          :props="{ label: it.treeProps?.label ?? 'title', children: it.treeProps?.children ?? 'children' }"
          node-key="id"
          :multiple="it.multiple ?? false"
          :show-checkbox="it.multiple ?? false"
          :check-strictly="it.checkStrictly ?? false"
          :placeholder="it.placeholder ?? `请选择${it.label}`"
          :disabled="isDisabled(it)"
          default-expand-all
          clearable
          class="w-full"
        />
        <div v-if="it.tip" class="w-full text-12px leading-5 text-[var(--el-text-color-secondary)]">
          {{ it.tip }}
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
    </template>
  </el-drawer>
</template>
