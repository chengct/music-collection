<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  Search, X, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ExternalLink, Disc3,
} from 'lucide-vue-next'
import { auth } from '../auth'
import { config } from '../config'
import { dbState, query, queryOne, run } from '../db'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const filters = reactive({ artist: '', title: '', type: 'ALL', folder: 'ALL' })
const page = ref(1)

const visibleOnly = 'folder IN (SELECT folder FROM visble_folder WHERE visble = 1)'

// 管理者可見所有 folder，非管理者只看 visble = 1 的
const folders = computed(() => {
  dbState.version
  const sql = auth.user.admin
    ? `SELECT folder FROM visble_folder UNION SELECT folder FROM collection
       WHERE folder IS NOT NULL AND folder <> '' ORDER BY folder`
    : 'SELECT folder FROM visble_folder WHERE visble = 1 ORDER BY folder'
  return query(sql).map((r) => r.folder)
})

const where = computed(() => {
  const parts = []
  const params = {}
  if (filters.artist.trim()) {
    parts.push('instr(ulower(artist), $artist) > 0')
    params.$artist = filters.artist.trim().toLowerCase()
  }
  if (filters.title.trim()) {
    parts.push('instr(ulower(title), $title) > 0')
    params.$title = filters.title.trim().toLowerCase()
  }
  if (filters.type === 'commercial') parts.push('COALESCE(sampler, 0) = 0')
  if (filters.type === 'sampler') parts.push('sampler = 1')
  if (filters.folder !== 'ALL') {
    parts.push('folder = $folder')
    params.$folder = filters.folder
  }
  if (!auth.user.admin) parts.push(visibleOnly)
  return { sql: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params }
})

const total = computed(() => {
  dbState.version
  return queryOne(`SELECT COUNT(*) AS n FROM collection ${where.value.sql}`, where.value.params).n
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / config.pageSize)))

const offset = computed(() => (Math.max(1, Math.trunc(Number(page.value)) || 1) - 1) * config.pageSize)

const rows = computed(() => {
  dbState.version
  return query(
    `SELECT rowid AS id, * FROM collection ${where.value.sql}
     ORDER BY ulower(artist), ulower(title) LIMIT $limit OFFSET $offset`,
    {
      ...where.value.params,
      $limit: config.pageSize,
      $offset: offset.value,
    },
  )
})

watch(filters, () => (page.value = 1))
watch([page, pageCount], ([p, n]) => {
  const fixed = Math.min(Math.max(1, Math.trunc(Number(p)) || 1), n)
  if (fixed !== p) page.value = fixed
})

function year(date) {
  const m = /^\d{4}/.exec(date ?? '')
  return m && m[0] !== '0000' ? m[0] : '-'
}

// 新增 / 編輯
const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'artist', label: 'Artist', required: true },
  { key: 'release_id', label: 'Release ID' },
  { key: 'release_date', label: 'Release Date' },
  { key: 'label', label: 'Label' },
  { key: 'catalog_no', label: 'Catalog No' },
]
const editing = ref(null)
const formError = ref('')

function openForm(row) {
  formError.value = ''
  editing.value = row
    ? { ...row, hidden: !!row.hidden, sampler: !!row.sampler }
    : {
        id: null, title: '', artist: '', release_id: '', release_date: '', label: '', catalog_no: '',
        folder: filters.folder === 'ALL' ? '' : filters.folder, hidden: false, sampler: false,
      }
}

async function save() {
  const f = editing.value
  for (const k of ['title', 'artist', 'release_id', 'release_date', 'label', 'catalog_no', 'folder']) {
    f[k] = (f[k] ?? '').trim()
  }
  if (!f.title || !f.artist || !f.folder) {
    formError.value = 'Title、Artist、Folder 為必填'
    return
  }
  const params = {
    $release_id: f.release_id, $artist: f.artist, $title: f.title, $label: f.label,
    $release_date: f.release_date, $folder: f.folder, $catalog_no: f.catalog_no,
    $hidden: f.hidden ? 1 : 0, $sampler: f.sampler ? 1 : 0,
  }
  if (f.id) {
    await run(
      `UPDATE collection SET release_id = $release_id, artist = $artist, title = $title, label = $label,
       release_date = $release_date, folder = $folder, catalog_no = $catalog_no, hidden = $hidden,
       sampler = $sampler WHERE rowid = $id`,
      { ...params, $id: f.id },
    )
  } else {
    await run(
      `INSERT INTO collection (release_id, artist, title, label, release_date, folder, catalog_no, hidden, sampler)
       VALUES ($release_id, $artist, $title, $label, $release_date, $folder, $catalog_no, $hidden, $sampler)`,
      params,
    )
  }
  // 新的 folder 自動加入 visble_folder (預設可見)
  await run(
    `INSERT INTO visble_folder (id, folder, visble)
     SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM visble_folder), $folder, 1
     WHERE NOT EXISTS (SELECT 1 FROM visble_folder WHERE folder = $folder)`,
    { $folder: f.folder },
  )
  editing.value = null
}

// 刪除
const deleting = ref(null)

async function remove() {
  await run('DELETE FROM collection WHERE rowid = $id', { $id: deleting.value.id })
  deleting.value = null
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">Collection</h1>
        <p class="page-sub">共 {{ total.toLocaleString() }} 筆</p>
      </div>
      <button class="btn btn-primary" @click="openForm()"><Plus :size="18" />新增 CD</button>
    </div>

    <div class="filters">
      <label class="search">
        <Search :size="18" />
        <input v-model="filters.artist" class="input" placeholder="搜尋 Artist" />
        <button
          v-if="filters.artist"
          type="button"
          class="clear"
          title="清除"
          aria-label="清除 Artist"
          @click.prevent="filters.artist = ''"
        ><X :size="16" /></button>
      </label>
      <label class="search">
        <Search :size="18" />
        <input v-model="filters.title" class="input" placeholder="搜尋 Title" />
        <button
          v-if="filters.title"
          type="button"
          class="clear"
          title="清除"
          aria-label="清除 Title"
          @click.prevent="filters.title = ''"
        ><X :size="16" /></button>
      </label>
      <select v-model="filters.type" class="select" aria-label="類別">
        <option value="ALL">All</option>
        <option value="commercial">Commercial</option>
        <option value="sampler">Sampler</option>
      </select>
      <select v-model="filters.folder" class="select" aria-label="Folder">
        <option value="ALL">ALL</option>
        <option v-for="f in folders" :key="f" :value="f">{{ f }}</option>
      </select>
    </div>

    <div class="card list">
      <div class="head">
        <span class="head-title">Title/Artist</span>
        <span>Discogs ID</span>
        <span class="year">Year</span>
        <span>Folder</span>
        <span class="head-action">Action</span>
      </div>
      <div v-if="!rows.length" class="empty">找不到符合的 CD</div>
      <div v-for="(row, i) in rows" :key="row.id" class="item">
        <span class="no">{{ offset + i + 1 }}</span>
        <div class="cover"><Disc3 :size="22" /></div>
        <div class="info">
          <div class="title-row">
            <strong class="title">{{ row.title }}</strong>
            <span v-if="row.sampler" class="tag tag-sampler">sampler</span>
          </div>
          <span class="artist">{{ row.artist }}</span>
        </div>
        <div class="meta">
          <a
            v-if="row.release_id"
            class="rid"
            :href="config.discogsUrl + row.release_id"
            target="_blank"
            rel="noopener"
          >{{ row.release_id }}<ExternalLink :size="12" /></a>
          <span v-else class="rid muted">-</span>
          <span class="year">{{ year(row.release_date) }}</span>
          <span class="folder"><span v-if="row.folder" class="tag tag-folder">{{ row.folder }}</span></span>
        </div>
        <div class="actions">
          <button class="icon-btn" title="編輯" aria-label="編輯" @click="openForm(row)"><Pencil :size="16" /></button>
          <button class="icon-btn danger" title="刪除" aria-label="刪除" @click="deleting = row"><Trash2 :size="16" /></button>
        </div>
      </div>
    </div>

    <div v-if="pageCount > 1" class="pager">
      <button class="icon-btn" :disabled="page <= 1" aria-label="上一頁" @click="page--"><ChevronLeft :size="20" /></button>
      <span>第 <input v-model.number="page" type="number" min="1" :max="pageCount" class="page-input" /> / {{ pageCount }} 頁</span>
      <button class="icon-btn" :disabled="page >= pageCount" aria-label="下一頁" @click="page++"><ChevronRight :size="20" /></button>
    </div>

    <AppModal v-if="editing" :title="editing.id ? '編輯 CD' : '新增 CD'" @close="editing = null">
      <form id="cd-form" class="form" @submit.prevent="save">
        <label v-for="f in fields" :key="f.key" class="field" :class="{ wide: f.key === 'title' || f.key === 'artist' }">
          <span>{{ f.label }}{{ f.required ? ' *' : '' }}</span>
          <input v-model="editing[f.key]" class="input" :required="f.required" />
        </label>
        <label class="field">
          <span>Folder *</span>
          <input v-model="editing.folder" class="input" list="folder-list" required />
          <datalist id="folder-list">
            <option v-for="f in folders" :key="f" :value="f" />
          </datalist>
        </label>
        <div class="field checks">
          <label class="check"><input v-model="editing.hidden" type="checkbox" />Hidden</label>
          <label class="check"><input v-model="editing.sampler" type="checkbox" />Sampler</label>
        </div>
        <p v-if="formError" class="error-text wide">{{ formError }}</p>
      </form>
      <template #footer>
        <button class="btn" @click="editing = null">取消</button>
        <button class="btn btn-primary" type="submit" form="cd-form">儲存</button>
      </template>
    </AppModal>

    <ConfirmDialog
      v-if="deleting"
      title="刪除 CD"
      :message="`確定要刪除「${deleting.title}」(${deleting.artist}) 嗎？`"
      @close="deleting = null"
      @confirm="remove"
    />
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr 1fr 160px 200px;
  gap: 12px;
  margin-bottom: 20px;
}

.search {
  position: relative;
  color: var(--text-muted);
}

.search > svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search .input {
  padding-left: 44px;
  padding-right: 44px;
}

.clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.clear:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.select {
  cursor: pointer;
}

.list {
  --cols: 32px 44px minmax(0, 1fr) 110px 44px 150px 76px;
  padding: 0 8px 8px;
}

.head {
  position: sticky;
  top: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: var(--cols);
  align-items: center;
  gap: 16px;
  padding: 14px 12px 10px;
  border-bottom: 1px solid var(--border);
  border-radius: 8px 8px 0 0;
  background: var(--surface);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.head-title {
  grid-column: 3;
}

.head-action {
  text-align: center;
}

.list .head + * {
  margin-top: 8px;
}

.item {
  display: grid;
  grid-template-columns: var(--cols);
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 6px;
  transition: background 0.12s;
}

.item:hover {
  background: var(--surface-hover);
}

.no {
  min-width: 32px;
  text-align: right;
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.cover {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 4px;
  background: var(--surface-2);
  color: var(--text-muted);
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.title {
  font-size: 15px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist {
  font-size: 14px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: contents;
  font-size: 13px;
  color: var(--text-muted);
}

.folder {
  min-width: 0;
  display: flex;
}

.folder .tag {
  overflow: hidden;
  text-overflow: ellipsis;
}

.rid {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--accent-text);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

.rid:hover {
  text-decoration: underline;
}

.rid.muted {
  color: var(--text-muted);
}

.year {
  font-size: 13px;
  color: var(--text-muted);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tag {
  padding: 1px 10px;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
}

.tag-folder {
  color: var(--tag-blue);
}

.tag-sampler {
  color: var(--tag-orange);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-muted);
}

.pager .icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
  background: none;
}

.page-input {
  width: 56px;
  padding: 4px 6px;
  border: none;
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--text);
  text-align: center;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.wide {
  grid-column: 1 / -1;
}

.checks {
  flex-direction: row;
  align-items: flex-end;
  gap: 20px;
  padding-bottom: 10px;
}

@media (max-width: 896px) {
  .head {
    top: 56px;
  }
}

@media (max-width: 768px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .head {
    display: none;
  }

  .list {
    padding-top: 8px;
  }

  .item {
    grid-template-columns: auto 1fr auto;
    gap: 6px 12px;
  }

  .cover {
    display: none;
  }

  .no {
    grid-row: 1 / span 2;
    min-width: 24px;
  }

  .meta {
    grid-row: 2;
    grid-column: 2;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 16px;
  }

  .actions {
    grid-row: 1 / span 2;
    grid-column: 3;
  }

  .form {
    grid-template-columns: 1fr;
  }
}
</style>
