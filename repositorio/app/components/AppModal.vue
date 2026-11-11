<script setup lang="ts">
import { X } from 'lucide-vue-next'
const props = withDefaults(defineProps<{ titulo: string; largura?: string; open: boolean }>(), { largura: '560px' })
const emit = defineEmits<{ close: [] }>()
function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && props.open) emit('close') }
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>
<template>
  <Teleport to="body">
    <Transition name="m">
      <div v-if="open" class="overlay" @mousedown.self="emit('close')">
        <div class="modal" :style="{ maxWidth: largura }" role="dialog" aria-modal="true">
          <header>
            <h2>{{ titulo }}</h2>
            <button class="btn ghost icon sm" aria-label="Fechar" @click="emit('close')"><X :size="18" /></button>
          </header>
          <div class="body"><slot /></div>
          <footer v-if="$slots.footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(13, 43, 94, .45); z-index: 900; display: flex; align-items: flex-start; justify-content: center; padding: 6vh 16px 16px; overflow-y: auto; backdrop-filter: blur(2px); }
.modal { background: #fff; border-radius: 14px; width: 100%; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; max-height: 88vh; }
header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.body { padding: 20px; overflow-y: auto; }
footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; background: var(--row); border-radius: 0 0 14px 14px; }
.m-enter-active, .m-leave-active { transition: .2s; }
.m-enter-from, .m-leave-to { opacity: 0; }
@media (max-width: 640px) { .overlay { padding: 0; align-items: stretch; } .modal { border-radius: 0; max-height: 100vh; min-height: 100vh; } }
</style>
