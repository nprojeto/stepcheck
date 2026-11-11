<script setup lang="ts">
// Rota antiga (v1.0.0): redireciona para a etapa dentro do projeto.
const route = useRoute()
onMounted(async () => {
  try {
    const d = await api<any>('/etapas/' + route.params.id)
    await navigateTo(rotaProjeto(d.etapa.project_id, 'etapas/' + d.etapa.id), { replace: true })
  } catch { await navigateTo('/', { replace: true }) }
})
</script>
<template><LoadingBox /></template>
