<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'
const toasts = useToasts()
const fechar = (id: number) => (toasts.value = toasts.value.filter((t) => t.id !== id))
</script>
<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="t">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.tipo">
        <CheckCircle2 v-if="t.tipo === 'ok'" :size="18" />
        <AlertCircle v-else-if="t.tipo === 'erro'" :size="18" />
        <Info v-else :size="18" />
        <span class="grow">{{ t.texto }}</span>
        <button class="x" @click="fechar(t.id)"><X :size="15" /></button>
      </div>
    </TransitionGroup>
  </div>
</template>
<style scoped>
.toasts { position: fixed; right: 16px; bottom: 16px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; max-width: min(420px, calc(100vw - 32px)); }
.toast { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 10px; background: #fff; box-shadow: var(--shadow-lg); border-left: 4px solid var(--brand); font-size: 13.5px; color: var(--text-strong); }
.toast.ok { border-color: var(--ok); } .toast.ok svg:first-child { color: var(--ok); }
.toast.erro { border-color: var(--danger); } .toast.erro svg:first-child { color: var(--danger); }
.toast.info svg:first-child { color: var(--brand); }
.x { border: 0; background: none; cursor: pointer; color: var(--muted); padding: 0; }
.t-enter-active, .t-leave-active { transition: .25s; }
.t-enter-from, .t-leave-to { opacity: 0; transform: translateY(10px); }
</style>
