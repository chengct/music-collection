<script setup>
import { computed, ref } from 'vue'
import { Folder, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { dbState, query, queryOne, run, runAll } from '../db'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const folders = computed(() => {
  dbState.version
  return query(
    `SELECT v.id, v.folder, v.visble,
       (SELECT COUNT(*) FROM collection c WHERE c.folder = v.folder) AS count
     FROM visble_folder v ORDER BY v.folder`,
  )
})

const visibleCount = computed(() => folders.value.filter((f) => f.visble).length)

function toggle(f) {
  run('UPDATE visble_folder SET visble = $v WHERE id = $id', { $v: f.visble ? 0 : 1, $id: f.id })
}

const editing = ref(null)
const formError = ref('')

function openForm(f) {
  formError.value = ''
  editing.value = f
    ? { id: f.id, folder: f.folder, oldName: f.folder, count: f.count }
    : { id: null, folder: '' }
}

async function save() {
  const f = editing.value
  const name = f.folder.trim()
  if (!name) return (formError.value = '請輸入 Folder 名稱')
  const dup = queryOne('SELECT 1 FROM visble_folder WHERE ulower(folder) = $n AND id <> $id', {
    $n: name.toLowerCase(),
    $id: f.id ?? -1,
  })
  if (dup) return (formError.value = '此 Folder 名稱已存在')

  if (!f.id) {
    await run(
      `INSERT INTO visble_folder (id, folder, visble)
       SELECT COALESCE(MAX(id), 0) + 1, $n, 1 FROM visble_folder`,
      { $n: name },
    )
  } else if (name !== f.oldName) {
    // 改名時，Collection 裡舊 folder 的 CD 也一起改成新名稱
    await runAll([
      ['UPDATE visble_folder SET folder = $n WHERE id = $id', { $n: name, $id: f.id }],
      ['UPDATE collection SET folder = $n WHERE folder = $old', { $n: name, $old: f.oldName }],
    ])
  }
  editing.value = null
}

const deleting = ref(null)

// 只有 Collection 裡沒有 CD 的 folder 才能刪除
async function remove() {
  await run(
    `DELETE FROM visble_folder WHERE id = $id
     AND NOT EXISTS (SELECT 1 FROM collection WHERE folder = $folder)`,
    { $id: deleting.value.id, $folder: deleting.value.folder },
  )
  deleting.value = null
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">Visable Folder 管理</h1>
        <p class="page-sub">一般使用者只能看到開啟的 folder（{{ visibleCount }} / {{ folders.length }}）</p>
      </div>
      <button class="btn btn-primary" @click="openForm()"><Plus :size="18" />新增 Folder</button>
    </div>

    <div class="grid">
      <div v-for="f in folders" :key="f.id" class="card folder" :class="{ off: !f.visble }">
        <div class="icon"><Folder :size="22" /></div>
        <div class="info">
          <strong>{{ f.folder }}</strong>
          <span>{{ f.count }} CDs</span>
        </div>
        <div class="actions">
          <button class="icon-btn" title="編輯" :aria-label="`編輯 ${f.folder}`" @click="openForm(f)"><Pencil :size="16" /></button>
          <button
            class="icon-btn danger"
            :title="f.count ? '此 folder 還有 CD，無法刪除' : '刪除'"
            :aria-label="`刪除 ${f.folder}`"
            :disabled="f.count > 0"
            @click="deleting = f"
          ><Trash2 :size="16" /></button>
        </div>
        <button
          class="switch"
          role="switch"
          :aria-checked="!!f.visble"
          :aria-label="`${f.folder} 可見`"
          @click="toggle(f)"
        ><span /></button>
      </div>
    </div>

    <AppModal v-if="editing" :title="editing.id ? '編輯 Folder' : '新增 Folder'" width="420px" @close="editing = null">
      <form id="folder-form" class="form" @submit.prevent="save">
        <label class="field">
          <span>Folder 名稱 *</span>
          <input v-model="editing.folder" class="input" required autocomplete="off" />
        </label>
        <p v-if="editing.id" class="hint">改名後，此 folder 的 {{ editing.count }} 筆 CD 會一起改成新名稱</p>
        <p v-if="formError" class="error-text">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn" @click="editing = null">取消</button>
        <button class="btn btn-primary" type="submit" form="folder-form">儲存</button>
      </template>
    </AppModal>

    <ConfirmDialog
      v-if="deleting"
      title="刪除 Folder"
      :message="`確定要刪除 folder「${deleting.folder}」嗎？`"
      @close="deleting = null"
      @confirm="remove"
    />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 12px;
}

.folder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  transition: opacity 0.15s;
}

.folder.off .icon,
.folder.off .info {
  opacity: 0.45;
}

.icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--accent-text);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.info span {
  font-size: 13px;
  color: var(--text-muted);
}

.actions {
  flex: none;
  display: flex;
  gap: 2px;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
  background: none;
  color: var(--text-muted);
}

.switch {
  flex: none;
  position: relative;
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: var(--border);
  cursor: pointer;
  transition: background 0.2s;
}

.switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.3) 0 1px 3px;
  transition: transform 0.2s;
}

.switch[aria-checked='true'] {
  background: var(--accent);
}

.switch[aria-checked='true'] span {
  transform: translateX(20px);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
