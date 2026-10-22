<script setup>
import AppModal from './AppModal.vue'

defineProps({ title: String, message: String, confirmText: { type: String, default: '刪除' } })
const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <AppModal :title="title" width="420px" @close="emit('close')">
    <p class="msg">{{ message }}</p>
    <template #footer>
      <button class="btn" @click="emit('close')">取消</button>
      <button class="btn btn-danger" @click="emit('confirm')">{{ confirmText }}</button>
    </template>
  </AppModal>
</template>

<style scoped>
.msg {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
