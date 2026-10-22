<script setup>
import { computed } from 'vue'
import { Folder } from 'lucide-vue-next'
import { dbState, query, run } from '../db'

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
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">Visable Folder 管理</h1>
        <p class="page-sub">一般使用者只能看到開啟的 folder（{{ visibleCount }} / {{ folders.length }}）</p>
      </div>
    </div>

    <div class="grid">
      <div v-for="f in folders" :key="f.id" class="card folder" :class="{ off: !f.visble }">
        <div class="icon"><Folder :size="22" /></div>
        <div class="info">
          <strong>{{ f.folder }}</strong>
          <span>{{ f.count }} CDs</span>
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
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.folder {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  transition: opacity 0.15s;
}

.folder.off .icon,
.folder.off .info {
  opacity: 0.45;
}

.icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
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
</style>
