<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   主题面板（5 套配色色块 + 明暗模式开关，即时生效 + localStorage 持久化）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { Brush, Check, Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '@/composables/useTheme'

const { theme, mode, setTheme, setMode, THEME_OPTIONS } = useTheme()
</script>

<template>
  <el-popover placement="bottom-end" :width="280" trigger="click">
    <template #reference>
      <el-button circle text :icon="Brush" title="主题外观" />
    </template>

    <div class="bx-theme-panel">
      <div class="mb-2 text-sm font-600" :style="{ color: 'var(--bx-text-primary)' }">主题配色</div>
      <div class="bx-swatches">
        <button
          v-for="opt in THEME_OPTIONS"
          :key="opt.name"
          class="bx-swatch"
          :class="{ 'is-active': theme === opt.name }"
          :title="opt.label"
          @click="setTheme(opt.name)"
        >
          <span
            class="bx-swatch__chip"
            :style="{
              background: `linear-gradient(135deg, ${opt.sidebar} 0 48%, ${opt.primary} 48% 100%)`,
            }"
          >
            <el-icon v-if="theme === opt.name" class="bx-swatch__check"><Check /></el-icon>
          </span>
          <span class="bx-swatch__label">{{ opt.label }}</span>
        </button>
      </div>

      <el-divider class="!my-3" />

      <div class="mb-2 text-sm font-600" :style="{ color: 'var(--bx-text-primary)' }">外观模式</div>
      <el-radio-group
        :model-value="mode"
        @update:model-value="(v: string | number | boolean) => setMode(v as 'light' | 'dark')"
      >
        <el-radio-button value="light">
          <el-icon class="mr-1"><Sunny /></el-icon>明亮
        </el-radio-button>
        <el-radio-button value="dark">
          <el-icon class="mr-1"><Moon /></el-icon>暗黑
        </el-radio-button>
      </el-radio-group>
    </div>
  </el-popover>
</template>

<style scoped>
.bx-swatches {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.bx-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}
.bx-swatch__chip {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease;
}
.bx-swatch:hover .bx-swatch__chip {
  transform: translateY(-2px);
}
.bx-swatch.is-active .bx-swatch__chip {
  border-color: var(--bx-color-primary);
}
.bx-swatch__check {
  position: absolute;
  inset: 0;
  margin: auto;
  color: #fff;
  font-size: 14px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4));
}
.bx-swatch__label {
  font-size: 11px;
  color: var(--bx-text-secondary);
  white-space: nowrap;
}
</style>
