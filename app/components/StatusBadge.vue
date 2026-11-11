<script setup lang="ts">
const props = defineProps<{ status: string; curto?: boolean }>()
const s = computed(() => STATUS[props.status] ?? { label: props.status, curto: props.status, cor: 'var(--muted)', bg: 'var(--soft)' })
</script>
<template>
  <span class="badge" :style="{ color: s.cor, background: s.bg }"><span class="dot" />{{ curto ? s.curto : s.label }}</span>
</template>
