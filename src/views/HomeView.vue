<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   首页 Bento 数据仪表盘（欢迎 + 统计卡 + 快捷入口 + 系统信息 + 自助改密）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-08
  | @updated   2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Avatar, CircleCheck, Key, Menu as MenuIco } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/auth'
import type { MenuNode } from '@/api/auth'
import MenuIcon from '@/layouts/MenuIcon.vue'

const userStore = useUserStore()
const router = useRouter()

// —— 统计来源：均为登录后已具备的真实客户端数据，不造假数 ——
// TODO: 管理员总数 / 今日登录数等业务统计待后端 dashboard 统计接口就绪后接入
function countLeaves(menus: MenuNode[]): number {
  return menus.reduce(
    (n, m) => n + (m.children && m.children.length ? countLeaves(m.children) : 1),
    0,
  )
}
const menuCount = computed(() => countLeaves(userStore.menus))

const stats = computed(() => [
  { label: '我的角色', value: userStore.roles.length, icon: Avatar, tone: 'a' },
  { label: '权限点', value: userStore.perms.length, icon: Key, tone: 'b' },
  { label: '可见菜单', value: menuCount.value, icon: MenuIco, tone: 'c' },
  { label: '账号状态', value: '正常', icon: CircleCheck, tone: 'd' },
])

// —— 快捷入口：从菜单树扁平取叶子（真实可达路由），取前 8 ——
function flattenLeaves(menus: MenuNode[], acc: MenuNode[] = []): MenuNode[] {
  for (const m of menus) {
    if (m.children && m.children.length) {
      flattenLeaves(m.children, acc)
    } else if (m.path) {
      acc.push(m)
    }
  }
  return acc
}
const quickLinks = computed(() => flattenLeaves(userStore.menus).slice(0, 8))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const displayName = computed(() => userStore.user?.nickname || userStore.user?.username || '管理员')

// —— 自助改密 ——
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
  <div class="bx-dash">
    <!-- 欢迎横幅 -->
    <section class="bx-welcome">
      <div class="bx-welcome__main">
        <div class="bx-welcome__hi">{{ greeting }}，{{ displayName }} 👋</div>
        <div class="bx-welcome__sub">欢迎使用 BenXinAdmin 管理后台</div>
        <div class="bx-welcome__roles">
          <el-tag v-for="r in userStore.roles" :key="r" effect="dark" round>{{ r }}</el-tag>
        </div>
      </div>
      <el-button class="bx-welcome__btn" @click="pwdVisible = true">修改密码</el-button>
    </section>

    <!-- 统计卡片 -->
    <section class="bx-stats">
      <div v-for="s in stats" :key="s.label" class="bx-stat" :data-tone="s.tone">
        <div class="bx-stat__icon"><el-icon><component :is="s.icon" /></el-icon></div>
        <div class="bx-stat__meta">
          <div class="bx-stat__value">{{ s.value }}</div>
          <div class="bx-stat__label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- 快捷入口 + 系统信息 -->
    <section class="bx-grid">
      <div class="bx-panel bx-panel--quick">
        <div class="bx-panel__title">快捷入口</div>
        <div v-if="quickLinks.length" class="bx-quick">
          <button
            v-for="m in quickLinks"
            :key="m.id"
            class="bx-quick__item"
            @click="router.push(m.path)"
          >
            <MenuIcon :name="m.icon" />
            <span>{{ m.title }}</span>
          </button>
        </div>
        <el-empty v-else description="暂无可用菜单" :image-size="80" />
      </div>

      <div class="bx-panel bx-panel--info">
        <div class="bx-panel__title">系统信息</div>
        <ul class="bx-info">
          <li><span>系统名称</span><b>BenXinAdmin</b></li>
          <li><span>版本</span><b>v0.1.0</b></li>
          <li><span>后端</span><b>PHP 8.4 · ThinkPHP 8</b></li>
          <li><span>前端</span><b>Vue 3.5 · Element Plus</b></li>
          <li><span>开源协议</span><b>Apache-2.0</b></li>
        </ul>
      </div>
    </section>

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

<style scoped>
.bx-dash {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* —— 欢迎横幅（主色渐变）—— */
.bx-welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-radius: var(--bx-card-radius);
  color: #fff;
  background: linear-gradient(
    120deg,
    var(--bx-color-primary) 0%,
    color-mix(in srgb, var(--bx-color-primary) 70%, #8b5cf6) 100%
  );
  box-shadow: 0 10px 30px color-mix(in srgb, var(--bx-color-primary) 30%, transparent);
}
.bx-welcome__hi {
  font-size: 22px;
  font-weight: 700;
}
.bx-welcome__sub {
  margin-top: 4px;
  opacity: 0.9;
}
.bx-welcome__roles {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.bx-welcome__btn {
  flex-shrink: 0;
}

/* —— 统计卡片 —— */
.bx-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.bx-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--bx-card-bg);
  border: 1px solid var(--bx-card-border);
  border-radius: var(--bx-card-radius);
  box-shadow: var(--bx-card-shadow);
}
.bx-stat__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  font-size: 22px;
  color: var(--bx-color-primary);
  background: var(--bx-color-primary-soft);
}
.bx-stat[data-tone='b'] .bx-stat__icon {
  color: #16a34a;
  background: color-mix(in srgb, #16a34a 12%, transparent);
}
.bx-stat[data-tone='c'] .bx-stat__icon {
  color: #d97706;
  background: color-mix(in srgb, #d97706 12%, transparent);
}
.bx-stat[data-tone='d'] .bx-stat__icon {
  color: #7c3aed;
  background: color-mix(in srgb, #7c3aed 12%, transparent);
}
.bx-stat__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--bx-text-primary);
}
.bx-stat__label {
  margin-top: 2px;
  font-size: 13px;
  color: var(--bx-text-secondary);
}

/* —— 快捷入口 + 系统信息 —— */
.bx-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) {
  .bx-grid {
    grid-template-columns: 1fr;
  }
}
.bx-panel {
  padding: 20px;
  background: var(--bx-card-bg);
  border: 1px solid var(--bx-card-border);
  border-radius: var(--bx-card-radius);
  box-shadow: var(--bx-card-shadow);
}
.bx-panel__title {
  font-weight: 600;
  color: var(--bx-text-primary);
  margin-bottom: 16px;
}
.bx-quick {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}
.bx-quick__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  cursor: pointer;
  border-radius: var(--bx-control-radius);
  border: 1px solid var(--bx-border);
  background: var(--bx-card-bg);
  color: var(--bx-text-secondary);
  font-size: 13px;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}
.bx-quick__item:hover {
  transform: translateY(-2px);
  border-color: var(--bx-color-primary);
  color: var(--bx-color-primary);
}
.bx-quick__item .el-icon {
  font-size: 22px;
}
.bx-info {
  list-style: none;
  margin: 0;
  padding: 0;
}
.bx-info li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px dashed var(--bx-border);
}
.bx-info li:last-child {
  border-bottom: none;
}
.bx-info span {
  color: var(--bx-text-secondary);
}
.bx-info b {
  color: var(--bx-text-primary);
  font-weight: 500;
}
</style>
