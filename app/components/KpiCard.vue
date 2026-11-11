<script setup lang="ts">
defineProps<{ titulo: string; valor: number | string; icone: any; cor?: string; bg?: string; to?: string; detalhe?: string }>()
</script>
<template>
  <component :is="to ? 'NuxtLink' : 'div'" :to="to" class="kpi card">
    <span class="ic" :style="{ color: cor ?? 'var(--brand)', background: bg ?? 'var(--soft)' }"><component :is="icone" :size="20" /></span>
    <div class="grow">
      <div class="v">{{ valor }}</div>
      <div class="t">{{ titulo }}</div>
      <div v-if="detalhe" class="d">{{ detalhe }}</div>
    </div>
  </component>
</template>
<style scoped>
.kpi { display: flex; gap: 14px; align-items: center; padding: 16px; text-decoration: none !important; transition: .15s; }
a.kpi:hover { border-color: var(--brand-2); transform: translateY(-1px); }
.ic { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.v { font-family: var(--font-title); font-weight: 800; font-size: 24px; color: var(--navy); line-height: 1.1; }
.t { font-size: 12.5px; color: var(--muted); font-weight: 600; margin-top: 2px; }
.d { font-size: 11.5px; color: var(--muted); }
@media (max-width: 640px) { .kpi { flex-direction: column; align-items: flex-start; gap: 8px; padding: 12px; } .ic { width: 36px; height: 36px; } .v { font-size: 20px; } }
</style>
