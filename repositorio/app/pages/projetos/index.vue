<script setup lang="ts">
import { Plus, Search, Users, ListChecks, FolderKanban } from 'lucide-vue-next'
const me = useMe()
const lista = ref<any[]>([])
const carregando = ref(true)
const busca = ref('')
const filtroStatus = ref('')
const novo = ref(false)
async function carregar() {
  carregando.value = true
  try { lista.value = await api('/projetos') } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)
const filtrados = computed(() => lista.value.filter((p) =>
  (!busca.value || p.nome.toLowerCase().includes(busca.value.toLowerCase())) && (!filtroStatus.value || p.status === filtroStatus.value)))
function criado(id: string) { novo.value = false; navigateTo('/projetos/' + id + '?aba=equipe') }
</script>
<template>
  <div>
    <div class="page-head">
      <div><h1>Projetos</h1><div class="sub">{{ lista.length }} projeto(s) disponível(is) para você.</div></div>
      <button v-if="me?.usuario.is_admin" class="btn" @click="novo = true"><Plus :size="17" /> Novo projeto</button>
    </div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar projeto…" /></div>
      <select v-model="filtroStatus" class="select"><option value="">Todos os status</option><option v-for="(l, k) in STATUS_PROJETO" :key="k" :value="k">{{ l }}</option></select>
    </div>
    <LoadingBox v-if="carregando" />
    <EmptyState v-else-if="!filtrados.length" texto="Nenhum projeto encontrado." :icone="FolderKanban" />
    <div v-else class="grid k3">
      <NuxtLink v-for="p in filtrados" :key="p.id" :to="'/projetos/' + p.id" class="card pcard">
        <div class="row top">
          <ProjectIcon :src="p.icone_url" size="lg" />
          <div class="grow">
            <h2 class="ellipsis">{{ p.nome }}</h2>
            <div class="row wrap mt-s"><span class="badge neutral">{{ STATUS_PROJETO[p.status] }}</span><RoleBadge v-for="r in p.meus_papeis" :key="r" :papel="r" /></div>
          </div>
        </div>
        <p class="desc muted mt">{{ p.descricao || 'Sem descrição.' }}</p>
        <div class="row between mt"><span class="small strong">Conclusão</span><span class="pct">{{ p.percentual }}%</span></div>
        <div class="stack-bar mt-s">
          <span v-for="s in STATUS_ORDEM" v-show="p.por_status?.[s]" :key="s" :style="{ width: (100 * (p.por_status?.[s] ?? 0) / (p.total_etapas || 1)) + '%', background: STATUS[s].cor }" :title="STATUS[s].label" />
        </div>
        <div class="row wrap mt small muted">
          <span class="row" style="gap:5px"><ListChecks :size="14" /> {{ p.total_etapas }} etapas</span>
          <span class="row" style="gap:5px"><Users :size="14" /> {{ p.participantes }} participantes</span>
          <span class="grow" />
          <span>Resp.: {{ p.responsavel?.nome ?? '—' }}</span>
        </div>
      </NuxtLink>
    </div>
    <ProjectForm :open="novo" @close="novo = false" @salvo="criado" />
  </div>
</template>
<style scoped>
.pcard { display: block; text-decoration: none !important; color: inherit; transition: .15s; }
.pcard:hover { border-color: var(--brand-2); transform: translateY(-2px); }
.desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 42px; font-size: 13px; }
.pct { font-family: var(--font-title); font-weight: 800; color: var(--navy); }
</style>
