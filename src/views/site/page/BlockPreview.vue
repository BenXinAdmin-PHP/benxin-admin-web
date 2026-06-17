<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   搭建器画布·区块简易预览（Element Plus 风格近似，所见即所得定位）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-17
  +----------------------------------------------------------------------
  按当前预览语言（lang）解析 i18n 字段为字符串显示（空回退中文）。
  只读预览（编辑走右栏），全部文本走 {{ }} 插值自动转义、不 v-html（§8 XSS）。
  暗色科技风真实观感留 M6-D（Nuxt 渲染）；本组件仅后台近似预览。
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Block } from '@/api/page'
import type { I18nValue } from './blockSchema'

const props = defineProps<{ block: Block; lang: 'zh' | 'en' }>()

/** 解析 i18n 字段为当前语言字符串（空回退 zh），非对象原样转字符串 */
function pick(v: unknown): string {
  if (v && typeof v === 'object') {
    const o = v as Partial<I18nValue>
    const s = props.lang === 'en' ? o.en : o.zh
    return String(s || o.zh || '')
  }
  return String(v ?? '')
}

const b = computed(() => props.block)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const items = computed(() => (Array.isArray((b.value as any).items) ? (b.value as any).items : []))
</script>

<template>
  <!-- hero -->
  <div v-if="b.type === 'hero'" class="bx-pv bx-pv-hero">
    <span v-if="pick(b.eyebrow)" class="bx-eyebrow">{{ pick(b.eyebrow) }}</span>
    <h2 class="bx-hero-title">{{ pick(b.title) || '（主标题待填）' }}</h2>
    <p class="bx-sub">{{ pick(b.subtitle) }}</p>
    <div class="bx-btns">
      <el-button type="primary">{{ pick(b.ctaPrimary?.text) || '主按钮' }}</el-button>
      <el-button>{{ pick(b.ctaSecondary?.text) || '次按钮' }}</el-button>
    </div>
  </div>

  <!-- prose -->
  <div v-else-if="b.type === 'prose'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <p class="bx-body">{{ pick(b.body) }}</p>
  </div>

  <!-- feature-grid -->
  <div v-else-if="b.type === 'feature-grid'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <div class="bx-grid">
      <div v-for="(it, i) in items" :key="i" class="bx-feature">
        <div class="bx-icon-box">{{ String(it.icon || '') || '◇' }}</div>
        <div class="bx-feature-title">{{ pick(it.title) || '卡片标题' }}</div>
        <div class="bx-feature-desc">{{ pick(it.desc) }}</div>
      </div>
    </div>
  </div>

  <!-- moat -->
  <div v-else-if="b.type === 'moat'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <p class="bx-body">{{ pick(b.body) }}</p>
    <span v-if="pick(b.verifyCaption)" class="bx-verify">✓ {{ pick(b.verifyCaption) }}</span>
  </div>

  <!-- security -->
  <div v-else-if="b.type === 'security'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <p class="bx-body">{{ pick(b.body) }}</p>
    <div class="bx-chips">
      <el-tag v-for="(c, i) in (Array.isArray(b.chips) ? b.chips : [])" :key="i" type="success" effect="plain">
        {{ pick(c) }}
      </el-tag>
    </div>
  </div>

  <!-- badge-list -->
  <div v-else-if="b.type === 'badge-list'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <p v-if="pick(b.caption)" class="bx-caption">{{ pick(b.caption) }}</p>
    <div class="bx-chips">
      <el-tag v-for="(it, i) in items" :key="i" effect="plain">{{ String(it.label || '') }}</el-tag>
    </div>
  </div>

  <!-- showcase -->
  <div v-else-if="b.type === 'showcase'" class="bx-pv">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <div class="bx-grid">
      <div v-for="(it, i) in items" :key="i" class="bx-shot">
        <div class="bx-shot-img">
          <span v-if="!String(it.image || '')" class="bx-shot-ph">无图占位</span>
          <span v-else class="bx-shot-url">{{ String(it.image) }}</span>
        </div>
        <div class="bx-shot-cap">{{ pick(it.caption) || '图注' }}</div>
      </div>
    </div>
  </div>

  <!-- cta -->
  <div v-else-if="b.type === 'cta'" class="bx-pv bx-pv-cta">
    <h3 class="bx-title">{{ pick(b.title) || '（标题待填）' }}</h3>
    <p class="bx-body">{{ pick(b.body) }}</p>
    <div class="bx-btns">
      <el-button
        v-for="(btn, i) in (Array.isArray(b.buttons) ? b.buttons : [])"
        :key="i"
        :type="String(btn.variant) === 'secondary' ? 'default' : 'primary'"
      >
        {{ pick(btn.text) || '按钮' }}
      </el-button>
    </div>
    <pre v-if="String(b.quickstart || '')" class="bx-code">{{ String(b.quickstart) }}</pre>
  </div>

  <!-- 未知块（描述符未覆盖） -->
  <div v-else class="bx-pv">
    <el-alert type="warning" :closable="false" :title="`未知区块类型：${b.type}`" />
  </div>
</template>

<style scoped>
.bx-pv {
  padding: 4px 2px;
  color: var(--bx-text-primary);
}
.bx-pv-hero,
.bx-pv-cta {
  text-align: center;
  padding: 12px 2px;
}
.bx-eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 999px;
  background: var(--bx-tag-bg);
  color: var(--bx-tag-text);
}
.bx-hero-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
}
.bx-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
}
.bx-sub,
.bx-body {
  margin: 0 0 10px;
  color: var(--bx-text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}
.bx-caption {
  margin: 0 0 10px;
  color: var(--bx-text-tertiary);
  font-size: 13px;
}
.bx-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.bx-pv-hero .bx-btns,
.bx-pv-cta .bx-btns {
  justify-content: center;
}
.bx-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.bx-feature,
.bx-shot {
  padding: 12px;
  border: 1px solid var(--bx-border);
  border-radius: var(--bx-control-radius);
  background: var(--bx-card-bg);
}
.bx-icon-box {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border-radius: var(--bx-control-radius);
  background: var(--bx-color-primary-soft);
  color: var(--bx-color-primary);
  font-size: 12px;
  overflow: hidden;
}
.bx-feature-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.bx-feature-desc {
  font-size: 13px;
  color: var(--bx-text-secondary);
  line-height: 1.5;
}
.bx-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bx-verify {
  display: inline-block;
  font-size: 12px;
  color: var(--el-color-success);
}
.bx-shot-img {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88px;
  margin-bottom: 8px;
  border-radius: var(--bx-control-radius);
  border: 1px dashed var(--bx-border);
  background: var(--bx-page-bg);
  color: var(--bx-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  padding: 0 6px;
}
.bx-shot-url {
  word-break: break-all;
  text-align: center;
}
.bx-shot-cap {
  font-size: 13px;
  color: var(--bx-text-secondary);
}
.bx-code {
  margin: 12px 0 0;
  padding: 10px 12px;
  text-align: left;
  border-radius: var(--bx-control-radius);
  background: var(--bx-table-header-bg);
  color: var(--bx-text-primary);
  font-family: var(--el-font-family-mono, ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
