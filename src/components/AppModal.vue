<script setup>
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

defineProps({ title: String, width: { type: String, default: '520px' } })
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="backdrop" @mousedown.self="emit('close')">
      <div class="dialog" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
        <header>
          <h2>{{ title }}</h2>
          <button class="icon-btn" aria-label="關閉" @click="emit('close')"><X :size="20" /></button>
        </header>
        <div class="body"><slot /></div>
        <footer v-if="$slots.footer"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  animation: fade 0.15s ease-out;
}

.dialog {
  width: 100%;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  animation: pop 0.18s ease-out;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 8px 24px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.body {
  padding: 8px 24px 16px;
  overflow-y: auto;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px 24px;
}

@keyframes fade {
  from { opacity: 0; }
}

@keyframes pop {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
}
</style>
