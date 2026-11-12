<script setup lang="ts">
import { Plus, Search, Layers, Pencil, Download, Archive } from 'lucide-vue-next'
const route = useRoute()
const projeto = useProjeto()
const d = computed(() => projeto.value!)
const pid = computed(() => d.value.projeto.id)
const busca = ref('')
const filtroStatus = ref((route.query.status as string) ?? '')
const filtroModulo = ref('')
const novaEtapa = ref(false)
const modModulos = ref(false)
const verExcluidas = ref(false)

onMounted(() => carregarProjeto(pid.value).catch(toastErro))
watch(() => route.query.status, (s) => { filtroStatus.value = (s as string) ?? '' })
watch(filtroStatus, (s) => navigateTo({ query: s ? { status: s } : {} }, { replace: true }))

const statusLista = computed(() => filtroStatus.value ? filtroStatus.value.split(',') : [])
const etapasFiltradas = computed(() => d.value.etapas.filter((e: any) =>
  (!busca.value || (e.nome + ' #' + e.codigo).toLowerCase().includes(busca.value.toLowerCase()))
  && (!statusLista.value.length || statusLista.value.includes(e.status))
  && (!filtroModulo.value || e.modulo === filtroModulo.value)))
const grupos = computed(() => {
  const g: { modulo: string; itens: any[] }[] = []
  for (const e of etapasFiltradas.value) {
    const nome = e.modulo ?? 'Sem módulo'
    let x = g.find((y) => y.modulo === nome)
    if (!x) { x = { modulo: nome, itens: [] }; g.push(x) }
    x.itens.push(e)
  }
  return g
})
const porStatus = computed(() => {
  const t: Record<string, number> = {}
  for (const e of d.value.etapas) t[e.status] = (t[e.status] ?? 0) + 1
  return t
})
function alternaStatus(s: string) { filtroStatus.value = filtroStatus.value === s ? '' : s }
const abrir = (e: any) => navigateTo(rotaProjeto(pid.value, 'etapas/' + e.id))
function etapaCriada(sid: string) { novaEtapa.value = false; navigateTo(rotaProjeto(pid.value, 'etapas/' + sid)) }

// Módulos
const novoModulo = ref('')
async function criarModulo() {
  if (!novoModulo.value.trim()) return
  try { await api(`/projetos/${pid.value}/modulos`, { method: 'POST', body: { nome: novoModulo.value } }); novoModulo.value = ''; toast('Módulo criado.'); carregarProjeto(pid.value) }
  catch (e) { toastErro(e) }
}
async function renomearModulo(m: any) {
  const nome = prompt('Novo nome do módulo:', m.nome)
  if (!nome || nome === m.nome) return
  try { await api('/modulos/' + m.id, { method: 'PATCH', body: { nome } }); toast('Módulo renomeado.'); carregarProjeto(pid.value) } catch (e) { toastErro(e) }
}
const qtdModulo = (nome: string) => d.value.etapas.filter((e: any) => e.modulo === nome).length

function exportar() {
  baixarCsv(`etapas-${d.value.projeto.nome}.csv`, [
    ['Nº', 'Etapa', 'Módulo', 'Status', 'Tentativa', 'Testador atual', 'Status desde', 'Critérios', 'Reprovações'],
    ...etapasFiltradas.value.map((e: any) => [e.codigo, e.nome, e.modulo, STATUS[e.status]?.label, e.tentativa_atual, e.testador_atual_nome, dataHora(e.status_desde), e.qtd_criterios, e.qtd_reprovacoes]),
  ])
}
</script>

<template>
  <div>
    <div class="page-head">
      <div><h1>Etapas</h1><div class="sub">{{ d.etapas.length }} etapa(s) neste projeto.</div></div>
      <div class="row wrap">
        <button v-if="d.pode.admin_projeto && d.etapas_arquivadas?.length" class="btn secondary" @click="verExcluidas = true"><Archive :size="16" /> Excluídas ({{ d.etapas_arquivadas.length }})</button>
        <button class="btn secondary" @click="modModulos = true"><Layers :size="16" /> Módulos</button>
        <button class="btn secondary" :disabled="!etapasFiltradas.length" @click="exportar"><Download :size="16" /> CSV</button>
        <button v-if="d.pode.criar_etapa" class="btn" @click="novaEtapa = true"><Plus :size="17" /> Nova etapa</button>
      </div>
    </div>
    <div class="row wrap mb">
      <button v-for="s in STATUS_ORDEM" :key="s" class="chip" :class="{ on: statusLista.includes(s) }" @click="alternaStatus(s)">
        <span class="sq" :style="{ background: STATUS[s].cor }" /> {{ STATUS[s].curto }} <b>{{ porStatus[s] ?? 0 }}</b>
      </button>
    </div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar por nome ou número…" /></div>
      <select v-model="filtroModulo" class="select"><option value="">Todos os módulos</option><option v-for="m in d.modulos" :key="m.id" :value="m.nome">{{ m.nome }}</option></select>
      <select v-model="filtroStatus" class="select">
        <option value="">Todos os status</option>
        <option v-for="s in STATUS_ORDEM" :key="s" :value="s">{{ STATUS[s].label }}</option>
        <option value="reprovado,em_correcao">Reprovadas + em correção</option>
      </select>
    </div>
    <div class="card pad-0">
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th style="width:56px">Nº</th><th>Etapa</th><th>Status</th><th class="num">Tentativa</th><th>Testador atual</th><th>Desde</th><th class="num">Critérios</th><th class="num">Reprov.</th></tr></thead>
          <tbody>
            <template v-for="g in grupos" :key="g.modulo">
              <tr class="group"><td colspan="8">{{ g.modulo }} · {{ g.itens.length }}</td></tr>
              <tr v-for="e in g.itens" :key="e.id" class="clickable" @click="abrir(e)">
                <td class="muted">#{{ e.codigo }}</td>
                <td class="strong">{{ e.nome }}</td>
                <td><StatusBadge :status="e.status" /></td>
                <td class="num">{{ e.tentativa_atual || '—' }}</td>
                <td>{{ e.testador_atual_nome ?? '—' }}</td>
                <td class="nowrap small muted">{{ relativo(e.status_desde) }}</td>
                <td class="num">{{ e.qtd_criterios }}</td>
                <td class="num">{{ e.qtd_reprovacoes || '—' }}</td>
              </tr>
            </template>
            <tr v-if="!etapasFiltradas.length"><td colspan="8" class="empty">Nenhuma etapa encontrada.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal :open="modModulos" titulo="Módulos do projeto" @close="modModulos = false">
      <div v-if="d.pode.criar_etapa" class="row mb">
        <input v-model="novoModulo" class="input" placeholder="Nome do novo módulo" @keyup.enter="criarModulo" />
        <button class="btn" @click="criarModulo"><Plus :size="16" /> Adicionar</button>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th style="width:60px">Ordem</th><th>Módulo</th><th class="num">Etapas</th><th v-if="d.pode.criar_etapa" /></tr></thead>
          <tbody>
            <tr v-for="m in d.modulos" :key="m.id">
              <td class="muted">{{ m.ordem }}</td><td class="strong">{{ m.nome }}</td><td class="num">{{ qtdModulo(m.nome) }}</td>
              <td v-if="d.pode.criar_etapa" class="num"><button class="btn ghost sm" @click="renomearModulo(m)"><Pencil :size="14" /> Renomear</button></td>
            </tr>
            <tr v-if="!d.modulos.length"><td colspan="4" class="empty">Nenhum módulo.</td></tr>
          </tbody>
        </table>
      </div>
    </AppModal>
    <AppModal :open="verExcluidas" titulo="Etapas excluídas (arquivadas)" largura="760px" @close="verExcluidas = false">
      <p class="muted">Etapas excluídas não aparecem nas listas, painéis e relatórios, mas todo o histórico continua guardado. Abra uma etapa para restaurá-la.</p>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Nº</th><th>Etapa</th><th>Status ao excluir</th><th>Módulo</th></tr></thead>
          <tbody>
            <tr v-for="e in d.etapas_arquivadas" :key="e.id" class="clickable" @click="verExcluidas = false; abrir(e)">
              <td class="muted">#{{ e.codigo }}</td><td class="strong">{{ e.nome }}</td><td><StatusBadge :status="e.status" curto /></td><td class="small muted">{{ e.modulo ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppModal>
    <StepForm :open="novaEtapa" :projeto-id="pid" :modulos="d.modulos" :membros="d.membros"
              :pode-disponibilizar="d.meus_papeis.includes('disponibilizador') || d.pode.admin_projeto"
              :modulo-padrao="d.modulos.find((m: any) => m.nome === filtroModulo)?.id ?? null"
              @close="novaEtapa = false" @salvo="etapaCriada" />
  </div>
</template>

<style scoped>
.chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: #fff; border-radius: 99px; padding: 4px 10px; font: 500 12px var(--font); color: var(--text-strong); cursor: pointer; }
.chip.on { border-color: var(--brand); background: var(--soft); }
.chip b { color: var(--navy); }
.sq { width: 9px; height: 9px; border-radius: 3px; }
</style>
