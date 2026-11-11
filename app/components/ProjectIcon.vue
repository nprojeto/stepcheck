<script setup lang="ts">
import { FolderKanban } from 'lucide-vue-next'
defineProps<{ src?: string | null; size?: 'sm' | 'lg' | '' }>()
</script>
<template>
  <img v-if="src" :src="src" class="pico" :class="size" alt="" />
  <span v-else class="pico" :class="size"><FolderKanban :size="size === 'lg' ? 30 : size === 'sm' ? 15 : 20" /></span>
</template>
