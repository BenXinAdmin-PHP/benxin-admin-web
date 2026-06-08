<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   首页（后端 ping 联调自测，验证业务码拦截）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPing, type PingData } from '@/api/system'
import type { ApiEnvelope } from '@/utils/request'

const { t } = useI18n()

const loading = ref(false)
const ok = ref<boolean | null>(null)
const result = ref<ApiEnvelope<PingData> | null>(null)
const errorMsg = ref('')

async function handlePing() {
  loading.value = true
  ok.value = null
  result.value = null
  errorMsg.value = ''
  try {
    // code===0 时拦截器返回整个信封；非 0 / HTTP 错误会抛出并已弹出提示
    const res = await getPing()
    result.value = res
    ok.value = true
  } catch (e) {
    ok.value = false
    errorMsg.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">{{ t('home.title') }}</span>
          <el-button type="primary" :loading="loading" @click="handlePing">
            {{ loading ? t('home.pinging') : t('home.ping') }}
          </el-button>
        </div>
      </template>

      <p class="m-0 mb-4 text-[var(--el-text-color-secondary)]">{{ t('home.description') }}</p>

      <el-alert
        v-if="ok === true"
        :title="t('home.success')"
        type="success"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <el-alert
        v-else-if="ok === false"
        :title="`${t('home.failed')}：${errorMsg}`"
        type="error"
        :closable="false"
        show-icon
        class="mb-4"
      />

      <el-descriptions v-if="result" :column="1" border>
        <el-descriptions-item :label="t('common.code')">{{ result.code }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.msg')">{{ result.msg }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.requestId')">
          {{ result.request_id }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('common.timestamp')">
          {{ result.timestamp }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>
