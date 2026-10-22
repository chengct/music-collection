<script setup>
import { computed, ref } from 'vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { auth } from '../auth'
import { dbState, query, queryOne, run } from '../db'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const users = computed(() => {
  dbState.version
  return query('SELECT id, login_name, admin FROM user_info ORDER BY id')
})

const editing = ref(null)
const formError = ref('')

function openForm(u) {
  formError.value = ''
  editing.value = u
    ? { id: u.id, login_name: u.login_name, password: '', admin: !!u.admin }
    : { id: null, login_name: '', password: '', admin: false }
}

async function save() {
  const u = editing.value
  const name = u.login_name.trim()
  if (!name) return (formError.value = '請輸入 Login Name')
  if (!u.id && !u.password) return (formError.value = '請輸入 Password')
  const dup = queryOne('SELECT 1 FROM user_info WHERE login_name = $n AND id <> $id', {
    $n: name,
    $id: u.id ?? -1,
  })
  if (dup) return (formError.value = '此 Login Name 已存在')
  if (u.id === auth.user.id && !u.admin) return (formError.value = '不可移除自己的管理者權限')

  if (u.id) {
    await run(
      `UPDATE user_info SET login_name = $n, admin = $a,
       password = CASE WHEN $p = '' THEN password ELSE $p END WHERE id = $id`,
      { $n: name, $a: u.admin ? 1 : 0, $p: u.password, $id: u.id },
    )
    if (u.id === auth.user.id) auth.user.name = name
  } else {
    await run(
      `INSERT INTO user_info (id, login_name, password, admin)
       SELECT COALESCE(MAX(id), 0) + 1, $n, $p, $a FROM user_info`,
      { $n: name, $p: u.password, $a: u.admin ? 1 : 0 },
    )
  }
  editing.value = null
}

const deleting = ref(null)

async function remove() {
  await run('DELETE FROM user_info WHERE id = $id', { $id: deleting.value.id })
  deleting.value = null
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">User 管理</h1>
        <p class="page-sub">共 {{ users.length }} 位使用者</p>
      </div>
      <button class="btn btn-primary" @click="openForm()"><Plus :size="18" />新增 User</button>
    </div>

    <div class="card list">
      <div v-for="u in users" :key="u.id" class="row">
        <div class="avatar">{{ u.login_name[0]?.toUpperCase() }}</div>
        <div class="info">
          <strong>{{ u.login_name }}</strong>
          <span>ID {{ u.id }}</span>
        </div>
        <span class="badge" :class="{ accent: u.admin }">{{ u.admin ? '管理者' : '使用者' }}</span>
        <div class="actions">
          <button class="icon-btn" title="編輯" aria-label="編輯" @click="openForm(u)"><Pencil :size="16" /></button>
          <button
            class="icon-btn danger"
            title="刪除"
            aria-label="刪除"
            :disabled="u.id === auth.user.id"
            @click="deleting = u"
          ><Trash2 :size="16" /></button>
        </div>
      </div>
    </div>

    <AppModal v-if="editing" :title="editing.id ? '編輯 User' : '新增 User'" width="420px" @close="editing = null">
      <form id="user-form" class="form" @submit.prevent="save">
        <label class="field">
          <span>Login Name *</span>
          <input v-model="editing.login_name" class="input" required autocomplete="off" />
        </label>
        <label class="field">
          <span>Password{{ editing.id ? '（留空表示不變更）' : ' *' }}</span>
          <input v-model="editing.password" class="input" type="password" autocomplete="new-password" />
        </label>
        <label class="check"><input v-model="editing.admin" type="checkbox" />管理者</label>
        <p v-if="formError" class="error-text">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn" @click="editing = null">取消</button>
        <button class="btn btn-primary" type="submit" form="user-form">儲存</button>
      </template>
    </AppModal>

    <ConfirmDialog
      v-if="deleting"
      title="刪除 User"
      :message="`確定要刪除使用者「${deleting.login_name}」嗎？`"
      @close="deleting = null"
      @confirm="remove"
    />
  </div>
</template>

<style scoped>
.list {
  padding: 8px;
  max-width: 720px;
}

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 6px;
}

.row:hover {
  background: var(--surface-hover);
}

.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface-2);
  font-weight: 700;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info span {
  font-size: 13px;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 2px;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
  background: none;
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
