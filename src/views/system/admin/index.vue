<!--
  +----------------------------------------------------------------------
  | @project   BenXinAdmin
  | @mission   管理员管理（列表 + 编辑抽屉 + 手工槽：角色/岗位多选·部门树·密码·重置密码弹窗）
  | @author    仗键天涯(daxing)
  | @email     3442535897@qq.com
  | @date      2026-06-14
  +----------------------------------------------------------------------
-->
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import XTable from '@/components/XTable/index.vue'
import XFormDrawer from '@/components/XFormDrawer/index.vue'
import XUpload from '@/components/XUpload/index.vue'
import {
  createAdmin,
  deleteAdmin,
  getAdmin,
  listAdmins,
  resetAdminPassword,
  setAdminStatus,
  updateAdmin,
} from '@/api/admin'
import { listRoles } from '@/api/role'
import { listPosts } from '@/api/post'
import { getDeptTree } from '@/api/dept'
import type { OptionItem, Row, XTableConfig } from '@/components/XTable/types'
import type { XFormDrawerConfig } from '@/components/XFormDrawer/types'

const api = {
  list: listAdmins,
  save: createAdmin,
  update: updateAdmin,
  remove: deleteAdmin,
  status: setAdminStatus,
}

// —— 角色/岗位下拉选项（多选取数，整页一次）——
const roleOptions = ref<OptionItem[]>([])
const postOptions = ref<OptionItem[]>([])
onMounted(async () => {
  const [r, p] = await Promise.all([
    listRoles({ page: 1, page_size: 200 }),
    listPosts({ page: 1, page_size: 200 }),
  ])
  roleOptions.value = r.data.list.map((it) => ({ label: it.name, value: it.id }))
  postOptions.value = p.data.list.map((it) => ({ label: it.name, value: it.id }))
})

/** 父级部门树：虚拟根「顶级」(id=0，dept_id 默认 0 = 无部门) */
async function deptTreeData(): Promise<Row[]> {
  const { data } = await getDeptTree()
  return [{ id: 0, name: '顶级', children: data }]
}

const config: XTableConfig = {
  api,
  rowKey: 'id',
  search: [
    { prop: 'keyword', label: '关键词', type: 'input', placeholder: '账号/昵称/手机号' },
    { prop: 'status', label: '状态', type: 'select', dict: 'sys_normal_disable', width: 160 },
  ],
  columns: [
    { prop: 'id', label: 'ID', width: 70 },
    { prop: 'username', label: '登录账号', width: 140 },
    { prop: 'nickname', label: '昵称', width: 140 },
    { prop: 'mobile', label: '手机号', width: 130 },
    { prop: 'email', label: '邮箱', minWidth: 160, showOverflowTooltip: true },
    { prop: 'status', label: '状态', type: 'switch', perm: 'system:admin:update', width: 80 },
    { prop: 'last_login_at', label: '最后登录', type: 'time', width: 170 },
    { prop: 'created_at', label: '创建时间', type: 'time', sortable: true, width: 180 },
  ],
  toolbar: { create: { perm: 'system:admin:create', label: '新增管理员' } },
  rowActions: [
    { label: '编辑', emit: 'edit', perm: 'system:admin:update' },
    { label: '重置密码', emit: 'resetPwd', perm: 'system:admin:update' },
    // 超管 admin 不可删（后端 protectedRows 422，前端先行隐藏）
    {
      label: '删除',
      emit: 'remove',
      perm: 'system:admin:delete',
      type: 'danger',
      confirm: true,
      show: (row) => row.username !== 'admin',
    },
  ],
}

const formConfig: XFormDrawerConfig = {
  entity: '管理员',
  api,
  width: 520,
  // 编辑回显走 detail 聚合（补全 role_ids/post_ids）
  detail: getAdmin,
  items: [
    { prop: 'username', label: '登录账号', type: 'input', required: true, disabledOnEdit: true },
    // 密码：仅新增可填（手工槽 el-input password；更新走「重置密码」弹窗）
    {
      prop: 'password',
      label: '初始密码',
      type: 'slot',
      required: true,
      requiredMessage: '请输入初始密码',
      visible: (_f, mode) => mode === 'create',
    },
    { prop: 'nickname', label: '昵称', type: 'input' },
    { prop: 'mobile', label: '手机号', type: 'input' },
    { prop: 'email', label: '邮箱', type: 'input' },
    {
      prop: 'dept_id',
      label: '所属部门',
      type: 'treeSelect',
      treeData: deptTreeData,
      treeProps: { label: 'name' },
      checkStrictly: true,
      defaultValue: 0,
    },
    // 角色/岗位：多选（手工槽 el-select multiple，提交 role_ids[]/post_ids[]）
    { prop: 'role_ids', label: '角色', type: 'slot', defaultValue: [] },
    { prop: 'post_ids', label: '岗位', type: 'slot', defaultValue: [] },
    // 头像（手工槽 XUpload 单图，可空）
    { prop: 'avatar', label: '头像', type: 'slot' },
    { prop: 'status', label: '状态', type: 'switch', activeValue: 1, inactiveValue: 0 },
    { prop: 'remark', label: '备注', type: 'textarea' },
  ],
}

const tableRef = ref<InstanceType<typeof XTable>>()
const drawerRef = ref<InstanceType<typeof XFormDrawer>>()

// —— 重置密码弹窗 ——
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdRow = ref<Row | null>(null)
const pwdForm = reactive({ password: '' })

function onAction(name: string, row: Row | null) {
  if (name === 'create') {
    drawerRef.value?.open('create')
  } else if (name === 'edit' && row) {
    drawerRef.value?.open('update', row)
  } else if (name === 'resetPwd' && row) {
    pwdRow.value = row
    pwdForm.password = ''
    pwdVisible.value = true
  }
}

async function submitPwd() {
  if (!pwdRow.value) {
    return
  }
  if (pwdForm.password.length < 6) {
    ElMessage.warning('密码长度至少 6 位')
    return
  }
  pwdLoading.value = true
  try {
    await resetAdminPassword(Number(pwdRow.value.id), pwdForm.password)
    ElMessage.success('密码已重置')
    pwdVisible.value = false
  } catch {
    // 拦截器已提示
  } finally {
    pwdLoading.value = false
  }
}
</script>

<template>
  <el-card shadow="never">
    <XTable ref="tableRef" :config="config" @action="onAction" />
  </el-card>

  <XFormDrawer ref="drawerRef" :config="formConfig" @success="tableRef?.reload()">
    <!-- 手工槽：初始密码（仅新增） -->
    <template #password="{ form }">
      <el-input v-model="form.password" type="password" show-password placeholder="请输入初始密码" />
    </template>
    <!-- 手工槽：角色多选 -->
    <template #role_ids="{ form }">
      <el-select v-model="form.role_ids" multiple clearable placeholder="请选择角色" class="w-full">
        <el-option v-for="o in roleOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </template>
    <!-- 手工槽：岗位多选 -->
    <template #post_ids="{ form }">
      <el-select v-model="form.post_ids" multiple clearable placeholder="请选择岗位" class="w-full">
        <el-option v-for="o in postOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </template>
    <!-- 手工槽：头像上传（单图，可空） -->
    <template #avatar="{ form, disabled }">
      <XUpload v-model="form.avatar" :disabled="disabled" />
    </template>
  </XFormDrawer>

  <el-dialog v-model="pwdVisible" title="重置密码" width="420px">
    <el-form :model="pwdForm" label-width="90px">
      <el-form-item label="账号">
        <span class="text-[var(--bx-text-secondary)]">{{ pwdRow?.username }}</span>
      </el-form-item>
      <el-form-item label="新密码">
        <el-input
          v-model="pwdForm.password"
          type="password"
          show-password
          placeholder="至少 6 位"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="pwdVisible = false">取消</el-button>
      <el-button type="primary" :loading="pwdLoading" @click="submitPwd">确定</el-button>
    </template>
  </el-dialog>
</template>
