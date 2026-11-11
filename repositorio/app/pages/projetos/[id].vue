<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'
// Moldura do projeto: carrega o projeto e exibe as páginas internas (visão geral, etapas, testes…)
const route = useRoute()
const id = computed(() => route.params.id as string)
const projeto = useProjeto()
const erro = ref('')
const editar = ref(false)

async function carregar() {
  erro.value = ''
  try { await carregarProjeto(id.value) } catch (e: any) { erro.value = e.message }
}
watch(id, () => { projeto.value = null; carregar() }, { immediate: true })
onUnmounted(() => { projeto.value = null })

const total = computed(() => projeto.value?.etapas.length ?? 0)
const aprovadas = computed(() => (projeto.value?.etapas ?? []).filter((e: any) => e.status === 'aprovado').length)
const pct = computed(() => total.value ? Math.round(1000 * aprovadas.value / total.value) / 10 : 0)
function salvo() { editar.value = false; carregar(); loadMe() }
</script>

<template>
  <div>
    <div v-if="erro" class="alert danger">{{ erro }}</div>
    <LoadingBox v-else-if="!projeto || projeto.projeto.id !== id" />
    <template v-else>
      <div class="phead card mb">
        <ProjectIcon :src="projeto.projeto.icone_url" size="lg" />
        <div class="grow" style="min-width:0">
          <div class="row wrap" style="gap:8px">
            <h1 class="ellipsis">{{ projeto.projeto.nome }}</h1>
            <span class="badge neutral">{{ STATUS_PROJETO[projeto.projeto.status] }}</span>
            <RoleBadge v-for="r in projeto.meus_papeis" :key="r" :papel="r" />
          </div>
          <div class="row mt-s" style="gap:12px">
            <div class="progress grow" style="max-width:420px"><span :style="{ width: pct + '%' }" /></div>
            <span class="small strong nowrap">{{ pct }}% · {{ aprovadas }}/{{ total }} aprovadas</span>
          </div>
        </div>
        <button v-if="projeto.pode.administrar" class="btn secondary sm" @click="editar = true"><Pencil :size="14" /> Editar projeto</button>
      </div>
      <NuxtPage />
      <ProjectForm :open="editar" :projeto="projeto.projeto" @close="editar = false" @salvo="salvo" />
    </template>
  </div>
</template>

<style scoped>
.phead { display: flex; align-items: center; gap: 16px; padding: 14px 18px; flex-wrap: wrap; }
.phead h1 { font-size: 20px; }
</style>
