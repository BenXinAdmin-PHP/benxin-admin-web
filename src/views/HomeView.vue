<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   首页（会话信息 + v-permission 演示 + 自助改密）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  | @updated   2026-06-09
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/auth'

const userStore = useUserStore()

// 自助改密
const pwdVisible = ref(false)
const pwdForm = reactive({ old_password: '', new_password: '' })
const pwdLoading = ref(false)

async function submitPwd() {
  if (!pwdForm.old_password || !pwdForm.new_password) {
    ElMessage.warning('请填写原密码与新密码')
    return
  }
  pwdLoading.value = true
  try {
    await changePassword(pwdForm.old_password, pwdForm.new_password)
    ElMessage.success('密码已修改，请重新登录')
    pwdVisible.value = false
    // 改密后后端已使当前会话失效，主动登出回登录页
    await userStore.logout()
    window.location.hash = '#/login'
    window.location.reload()
  } catch {
    // 拦截器已提示（如原密码不正确 422）
  } finally {
    pwdLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">当前会话</span>
          <el-button size="small" @click="pwdVisible = true">修改密码</el-button>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账号">{{ userStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userStore.user?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-for="r in userStore.roles" :key="r" class="mr-1">{{ r }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="权限点数">{{ userStore.perms.length }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header><span class="font-600">v-permission 演示（按钮按权限显隐）</span></template>
      <div class="flex flex-wrap gap-2">
        <el-button v-permission="'system:admin:create'" type="primary">新增管理员（admin:create）</el-button>
        <el-button v-permission="'system:role:create'" type="primary">新增角色（role:create）</el-button>
        <el-button v-permission="'system:menu:list'">查看菜单（menu:list）</el-button>
        <el-button v-permission="'system:dept:delete'" type="danger">删除部门（dept:delete）</el-button>
      </div>
      <p class="mt-3 text-[var(--el-text-color-secondary)]">
        无权限的按钮会被指令从 DOM 移除；超管可见全部。
      </p>
    </el-card>

    <el-dialog v-model="pwdVisible" title="修改密码" width="420px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.new_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitPwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
