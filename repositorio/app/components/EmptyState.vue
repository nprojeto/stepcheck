<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
defineProps<{ texto: string; icone?: any }>()
</script>
<template>
  <div class="empty">
    <component :is="icone ?? Inbox" :size="40" />
    <div>{{ texto }}</div>
    <div class="mt-s"><slot /></div>
  </div>
</template>
