<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   登录页（账号密码登录 → 拉 profile → 动态路由）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-09
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    // 守卫会在跳转时拉取 profile 并注册动态路由
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  } catch {
    // 拦截器已弹出错误提示（如账号或密码错误 401002）
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap flex min-h-screen items-center justify-center">
    <el-card class="w-96" shadow="always">
      <template #header>
        <div class="text-center text-lg font-600">BenXinAdmin 管理后台</div>
      </template>
      <el-form :model="form" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="请输入账号" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button type="primary" class="w-full" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrap {
  background: var(--el-bg-color-page);
}
</style>
