<script setup lang="ts">
import { Search, ListChecks, Download } from 'lucide-vue-next'
const route = useRoute()
const lista = ref<any[]>([])
const projetos = ref<any[]>([])
const carregando = ref(true)
const f = reactive({ q: '', status: (route.query.status as string) ?? '', projeto: (route.query.projeto as string) ?? '' })
async function carregar() {
  carregando.value = true
  try {
    lista.value = await api('/etapas', { query: { status: f.status, project_id: f.projeto } })
  } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(async () => {
  try { projetos.value = await api('/projetos') } catch {}
  carregar()
})
watch(() => [f.status, f.projeto], () => {
  navigateTo({ query: { ...(f.status ? { status: f.status } : {}), ...(f.projeto ? { projeto: f.projeto } : {}) } }, { replace: true })
  carregar()
})
watch(() => route.query.status, (s) => { if ((s ?? '') !== f.status) f.status = (s as string) ?? '' })
const filtrados = computed(() => lista.value.filter((e) => !f.q || (e.nome + ' #' + e.codigo + ' ' + (e.modulo ?? '')).toLowerCase().includes(f.q.toLowerCase())))
const statusOpcoes = [...STATUS_ORDEM.map((s) => ({ v: s, l: STATUS[s].label })), { v: 'reprovado,em_correcao', l: 'Reprovadas + em correção' }]
function exportar() {
  baixarCsv('etapas.csv', [
    ['Projeto', 'Nº', 'Etapa', 'Módulo', 'Status', 'Tentativa', 'Testador atual', 'Status desde', 'Critérios', 'Reprovações'],
    ...filtrados.value.map((e) => [e.projeto_nome, e.codigo, e.nome, e.modulo, STATUS[e.status]?.label, e.tentativa_atual, e.testador_atual_nome, dataHora(e.status_desde), e.qtd_criterios, e.qtd_reprovacoes]),
  ])
}
</script>
<template>
  <div>
    <div class="page-head">
      <div><h1>Etapas</h1><div class="sub">Todas as etapas dos seus projetos.</div></div>
      <button class="btn secondary" :disabled="!filtrados.length" @click="exportar"><Download :size="16" /> Exportar CSV</button>
    </div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="f.q" class="input" placeholder="Buscar etapa, número ou módulo…" /></div>
      <select v-model="f.projeto" class="select"><option value="">Todos os projetos</option><option v-for="p in projetos" :key="p.id" :value="p.id">{{ p.nome }}</option></select>
      <select v-model="f.status" class="select"><option value="">Todos os status</option><option v-for="o in statusOpcoes" :key="o.v" :value="o.v">{{ o.l }}</option></select>
    </div>
    <LoadingBox v-if="carregando" />
    <div v-else class="card pad-0">
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Projeto</th><th>Nº</th><th>Etapa</th><th>Módulo</th><th>Status</th><th class="num">Tent.</th><th>Testador atual</th><th>Desde</th></tr></thead>
          <tbody>
            <tr v-for="e in filtrados" :key="e.id" class="clickable" @click="navigateTo('/etapas/' + e.id)">
              <td><div class="row" style="gap:8px"><ProjectIcon :src="e.projeto_icone" size="sm" /><span class="nowrap">{{ e.projeto_nome }}</span></div></td>
              <td class="muted">#{{ e.codigo }}</td>
              <td class="strong">{{ e.nome }}</td>
              <td class="small muted">{{ e.modulo ?? '—' }}</td>
              <td><StatusBadge :status="e.status" /></td>
              <td class="num">{{ e.tentativa_atual || '—' }}</td>
              <td>{{ e.testador_atual_nome ?? '—' }}</td>
              <td class="small muted nowrap">{{ relativo(e.status_desde) }}</td>
            </tr>
            <tr v-if="!filtrados.length"><td colspan="8"><EmptyState texto="Nenhuma etapa encontrada." :icone="ListChecks" /></td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="small muted mt-s">{{ filtrados.length }} etapa(s)</div>
  </div>
</template>
