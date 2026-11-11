<script setup lang="ts">
defineProps<{ papel: string }>()
</script>
<template><span class="badge" :class="'role-' + papel">{{ PAPEL[papel] ?? papel }}</span></template>
