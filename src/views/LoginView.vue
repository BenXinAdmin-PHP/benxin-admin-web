<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   登录页（极光渐变 + 玻璃卡片；账号密码登录 → 拉 profile → 动态路由）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-09
  | @updated   2026-06-14
  +----------------------------------------------------------------------
  说明：极光背景为纯 CSS 多重模糊径向渐变（零版权，资源合规 §10）；登录页不跟随后台
  主题（登录前无主题偏好），固定品牌色 + 极光。登录逻辑/token/401 分流复用原实现，仅换皮。
-->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({ username: '', password: '' })
const remember = ref(false)
const loading = ref(false)

const STORAGE_REMEMBER = 'bx-login-username'

onMounted(() => {
  // 记住我：回填上次记住的账号
  const saved = localStorage.getItem(STORAGE_REMEMBER)
  if (saved) {
    form.username = saved
    remember.value = true
  }
})

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    // 记住我仅存账号（不存密码），符合最小化原则
    if (remember.value) {
      localStorage.setItem(STORAGE_REMEMBER, form.username)
    } else {
      localStorage.removeItem(STORAGE_REMEMBER)
    }
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
  <div class="aurora-login">
    <!--
      背景层（独立可替换）：默认纯 CSS 极光。部署者如需换图，可改为：
        .aurora-bg { background-image: url('/your-cc0-image.jpg'); background-size: cover; }
      仅使用自有或 CC0 可商用素材（资源合规 §10）。
      TODO（可选）：将登录背景做成读取 bx_config 的配置项，本期先留口不接后端。
    -->
    <div class="aurora-bg" aria-hidden="true">
      <span class="aurora-blob aurora-blob--1"></span>
      <span class="aurora-blob aurora-blob--2"></span>
      <span class="aurora-blob aurora-blob--3"></span>
      <span class="aurora-blob aurora-blob--4"></span>
    </div>

    <div class="login-card">
      <div class="login-card__brand">
        <div class="login-card__mark">BX</div>
        <div class="login-card__title">登录管理后台</div>
        <div class="login-card__sub">高效、安全的企业级后台管理系统</div>
      </div>

      <el-form :model="form" size="large" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <div class="login-card__row">
          <el-checkbox v-model="remember">记住我</el-checkbox>
        </div>
        <el-button
          type="primary"
          class="login-card__btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>

      <div class="login-card__footer">基于 Apache-2.0 开源 · BenXinAdmin</div>
    </div>
  </div>
</template>

<style scoped>
.aurora-login {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* 极光深色基底（登录页固定品牌色，不随主题） */
  background: radial-gradient(120% 120% at 50% 0%, #11183a 0%, #070b1c 60%, #05060f 100%);
}

/* —— 极光背景层（纯 CSS 模糊光晕，缓慢漂移）—— */
.aurora-bg {
  position: absolute;
  inset: 0;
  filter: blur(60px);
  pointer-events: none;
}
.aurora-blob {
  position: absolute;
  display: block;
  border-radius: 50%;
  opacity: 0.55;
  mix-blend-mode: screen;
  will-change: transform;
}
.aurora-blob--1 {
  top: -10%;
  left: 8%;
  width: 38vw;
  height: 38vw;
  background: radial-gradient(circle, #2b6fff 0%, transparent 70%);
  animation: aurora-drift-1 18s ease-in-out infinite alternate;
}
.aurora-blob--2 {
  top: 20%;
  right: 4%;
  width: 32vw;
  height: 32vw;
  background: radial-gradient(circle, #19c6e6 0%, transparent 70%);
  animation: aurora-drift-2 22s ease-in-out infinite alternate;
}
.aurora-blob--3 {
  bottom: -12%;
  left: 28%;
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #7c5cff 0%, transparent 70%);
  animation: aurora-drift-3 26s ease-in-out infinite alternate;
}
.aurora-blob--4 {
  bottom: 6%;
  right: 24%;
  width: 26vw;
  height: 26vw;
  background: radial-gradient(circle, #00d4a0 0%, transparent 70%);
  animation: aurora-drift-1 20s ease-in-out infinite alternate-reverse;
}
@keyframes aurora-drift-1 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(6%, 8%) scale(1.15);
  }
}
@keyframes aurora-drift-2 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(-8%, 6%) scale(1.1);
  }
}
@keyframes aurora-drift-3 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(5%, -7%) scale(1.18);
  }
}
@media (prefers-reduced-motion: reduce) {
  .aurora-blob {
    animation: none;
  }
}

/* —— 玻璃质感登录卡片 —— */
.login-card {
  position: relative;
  z-index: 1;
  width: 380px;
  max-width: calc(100vw - 32px);
  padding: 36px 32px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}
.login-card__brand {
  text-align: center;
  margin-bottom: 26px;
}
.login-card__mark {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 14px;
  border-radius: 14px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2b6fff, #7c5cff);
  box-shadow: 0 8px 24px rgba(43, 111, 255, 0.45);
}
.login-card__title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.login-card__sub {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
.login-card__row {
  margin-bottom: 18px;
}
.login-card__btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
  border: none;
  background: linear-gradient(135deg, #2b6fff, #7c5cff);
}
.login-card__btn:hover {
  background: linear-gradient(135deg, #3f7dff, #8d70ff);
}
.login-card__footer {
  margin-top: 18px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

/* 玻璃卡片内输入框：半透明深色，固定白字（不随后台主题切换） */
.login-card :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset;
}
.login-card :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #2b6fff inset;
}
.login-card :deep(.el-input__inner) {
  color: #fff;
}
.login-card :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}
.login-card :deep(.el-input__prefix),
.login-card :deep(.el-input__suffix) {
  color: rgba(255, 255, 255, 0.6);
}
.login-card :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.75);
}
</style>
