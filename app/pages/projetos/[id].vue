<script setup lang="ts">
import { Plus, Pencil, Search, Users, Layers, History, ListChecks, Save, BarChart3, ArrowLeft } from 'lucide-vue-next'
const route = useRoute()
const id = computed(() => route.params.id as string)
const me = useMe()
const d = ref<any>(null)
const carregando = ref(true)
const aba = ref((route.query.aba as string) || 'etapas')
const busca = ref('')
const filtroStatus = ref('')
const filtroModulo = ref('')
const editar = ref(false)
const novaEtapa = ref(false)

async function carregar() {
  try { d.value = await api('/projetos/' + id.value) } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)

const etapasFiltradas = computed(() => (d.value?.etapas ?? []).filter((e: any) =>
  (!busca.value || (e.nome + ' ' + e.codigo).toLowerCase().includes(busca.value.toLowerCase()))
  && (!filtroStatus.value || e.status === filtroStatus.value)
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
  for (const e of d.value?.etapas ?? []) t[e.status] = (t[e.status] ?? 0) + 1
  return t
})
const total = computed(() => d.value?.etapas.length ?? 0)
const pct = computed(() => total.value ? Math.round(1000 * (porStatus.value.aprovado ?? 0) / total.value) / 10 : 0)

// ----- Equipe -----
const usuarios = ref<any[]>([])
const equipe = ref<Record<string, string[]>>({})
const salvandoEquipe = ref(false)
async function abrirEquipe() {
  if (!me.value?.usuario.is_admin || usuarios.value.length) return
  try { usuarios.value = await api('/usuarios') } catch (e) { toastErro(e) }
  montarEquipe()
}
function montarEquipe() {
  const m: Record<string, string[]> = {}
  for (const x of d.value?.membros ?? []) (m[x.user_id] ??= []).push(x.papel)
  equipe.value = m
}
function tem(u: string, p: string) { return equipe.value[u]?.includes(p) }
function alterna(u: string, p: string) {
  const l = (equipe.value[u] ??= [])
  const i = l.indexOf(p); i >= 0 ? l.splice(i, 1) : l.push(p)
}
async function salvarEquipe() {
  salvandoEquipe.value = true
  try {
    const membros = Object.entries(equipe.value).flatMap(([user_id, ps]) => ps.map((papel) => ({ user_id, papel })))
    await api(`/projetos/${id.value}/membros`, { method: 'PUT', body: { membros } })
    toast('Equipe salva.')
    await carregar(); montarEquipe(); loadMe()
  } catch (e) { toastErro(e) } finally { salvandoEquipe.value = false }
}
const membrosPorPapel = (p: string) => (d.value?.membros ?? []).filter((m: any) => m.papel === p)

// ----- Módulos -----
const novoModulo = ref('')
async function criarModulo() {
  if (!novoModulo.value.trim()) return
  try { await api(`/projetos/${id.value}/modulos`, { method: 'POST', body: { nome: novoModulo.value } }); novoModulo.value = ''; toast('Módulo criado.'); carregar() }
  catch (e) { toastErro(e) }
}
async function renomearModulo(m: any) {
  const nome = prompt('Novo nome do módulo:', m.nome)
  if (!nome || nome === m.nome) return
  try { await api('/modulos/' + m.id, { method: 'PATCH', body: { nome } }); toast('Módulo renomeado.'); carregar() } catch (e) { toastErro(e) }
}
const qtdModulo = (nome: string) => (d.value?.etapas ?? []).filter((e: any) => e.modulo === nome).length

// ----- Atividades -----
const atividades = ref<any[]>([])
async function carregarAtividades() {
  try { atividades.value = (await api<any>('/historico', { query: { project_id: id.value, limit: 200 } })).itens } catch (e) { toastErro(e) }
}
watch(aba, (a) => { if (a === 'equipe') abrirEquipe(); if (a === 'atividades') carregarAtividades() }, { immediate: true })
watch(d, () => { if (aba.value === 'equipe' && usuarios.value.length) montarEquipe() })

function etapaCriada(sid: string) { novaEtapa.value = false; navigateTo('/etapas/' + sid) }
function projetoSalvo() { editar.value = false; carregar(); loadMe() }
</script>

<template>
  <div>
    <NuxtLink to="/projetos" class="small row" style="gap:4px;margin-bottom:10px"><ArrowLeft :size="14" /> Projetos</NuxtLink>
    <LoadingBox v-if="carregando" />
    <template v-else-if="d">
      <div class="card head mb">
        <div class="row top wrap">
          <ProjectIcon :src="d.projeto.icone_url" size="lg" />
          <div class="grow">
            <div class="row wrap"><h1>{{ d.projeto.nome }}</h1><span class="badge neutral">{{ STATUS_PROJETO[d.projeto.status] }}</span></div>
            <p class="muted mt-s pre">{{ d.projeto.descricao }}</p>
            <div class="row wrap small muted">
              <span>Responsável: <b class="strong">{{ d.projeto.responsavel?.nome ?? '—' }}</b></span>
              <span>· Criado em {{ data(d.projeto.created_at) }}</span>
              <span v-if="d.meus_papeis.length">· Seus papéis:</span>
              <RoleBadge v-for="r in d.meus_papeis" :key="r" :papel="r" />
            </div>
          </div>
          <div class="row">
            <NuxtLink :to="'/relatorios?projeto=' + d.projeto.id" class="btn secondary"><BarChart3 :size="16" /> Relatório</NuxtLink>
            <button v-if="d.pode.administrar" class="btn secondary" @click="editar = true"><Pencil :size="16" /> Editar</button>
          </div>
        </div>
        <div class="prog mt">
          <div class="row between"><span class="small strong">{{ porStatus.aprovado ?? 0 }} de {{ total }} etapas aprovadas</span><span class="pct">{{ pct }}%</span></div>
          <div class="stack-bar mt-s" style="height:12px">
            <span v-for="s in STATUS_ORDEM" v-show="porStatus[s]" :key="s" :style="{ width: (100 * (porStatus[s] ?? 0) / (total || 1)) + '%', background: STATUS[s].cor }" :title="STATUS[s].label" />
          </div>
          <div class="row wrap mt-s">
            <button v-for="s in STATUS_ORDEM" :key="s" class="chip" :class="{ on: filtroStatus === s }" @click="filtroStatus = filtroStatus === s ? '' : s; aba = 'etapas'">
              <span class="sq" :style="{ background: STATUS[s].cor }" /> {{ STATUS[s].curto }} <b>{{ porStatus[s] ?? 0 }}</b>
            </button>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" :class="{ active: aba === 'etapas' }" @click="aba = 'etapas'"><ListChecks :size="16" /> Etapas <span class="count">{{ total }}</span></button>
        <button class="tab" :class="{ active: aba === 'equipe' }" @click="aba = 'equipe'"><Users :size="16" /> Equipe <span class="count">{{ new Set(d.membros.map((m: any) => m.user_id)).size }}</span></button>
        <button class="tab" :class="{ active: aba === 'modulos' }" @click="aba = 'modulos'"><Layers :size="16" /> Módulos <span class="count">{{ d.modulos.length }}</span></button>
        <button class="tab" :class="{ active: aba === 'atividades' }" @click="aba = 'atividades'"><History :size="16" /> Atividades</button>
      </div>

      <!-- ETAPAS -->
      <div v-if="aba === 'etapas'">
        <div class="toolbar">
          <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar por nome ou número…" /></div>
          <select v-model="filtroModulo" class="select"><option value="">Todos os módulos</option><option v-for="m in d.modulos" :key="m.id" :value="m.nome">{{ m.nome }}</option></select>
          <select v-model="filtroStatus" class="select"><option value="">Todos os status</option><option v-for="s in STATUS_ORDEM" :key="s" :value="s">{{ STATUS[s].label }}</option></select>
          <span class="grow" />
          <button v-if="d.pode.criar_etapa" class="btn" @click="novaEtapa = true"><Plus :size="17" /> Nova etapa</button>
        </div>
        <div class="card pad-0">
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th style="width:56px">Nº</th><th>Etapa</th><th>Status</th><th class="num">Tentativa</th><th>Testador atual</th><th>Desde</th><th class="num">Critérios</th><th class="num">Reprov.</th></tr></thead>
              <tbody>
                <template v-for="g in grupos" :key="g.modulo">
                  <tr class="group"><td colspan="8">{{ g.modulo }} · {{ g.itens.length }}</td></tr>
                  <tr v-for="e in g.itens" :key="e.id" class="clickable" @click="navigateTo('/etapas/' + e.id)">
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
      </div>

      <!-- EQUIPE -->
      <div v-else-if="aba === 'equipe'">
        <template v-if="d.pode.administrar">
          <div class="alert info mb">Marque o papel de cada pessoa neste projeto. Uma pessoa pode ter mais de um papel, mas quem testa uma tentativa não pode aprová-la.</div>
          <div class="card pad-0">
            <div class="table-wrap">
              <table class="tbl">
                <thead><tr><th>Usuário</th><th>E-mail</th><th style="text-align:center">Disponibilizador</th><th style="text-align:center">Testador</th><th style="text-align:center">Aprovador</th></tr></thead>
                <tbody>
                  <tr v-for="u in usuarios.filter((x) => x.ativo || equipe[x.id]?.length)" :key="u.id">
                    <td class="strong">{{ u.nome }} <span v-if="!u.ativo" class="badge bad">inativo</span></td>
                    <td class="muted">{{ u.email }}</td>
                    <td v-for="p in ['disponibilizador', 'testador', 'aprovador']" :key="p" style="text-align:center">
                      <input type="checkbox" class="cb" :checked="tem(u.id, p)" @change="alterna(u.id, p)" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="row end mt"><button class="btn" :disabled="salvandoEquipe" @click="salvarEquipe"><Save :size="16" /> Salvar equipe</button></div>
        </template>
        <div v-else class="grid k3">
          <div v-for="p in ['disponibilizador', 'testador', 'aprovador']" :key="p" class="card">
            <div class="section-title"><RoleBadge :papel="p" /></div>
            <EmptyState v-if="!membrosPorPapel(p).length" texto="Ninguém." />
            <div v-for="m in membrosPorPapel(p)" :key="m.user_id" class="pessoa"><b class="strong">{{ m.nome }}</b><div class="small muted">{{ m.email }}</div></div>
          </div>
        </div>
      </div>

      <!-- MÓDULOS -->
      <div v-else-if="aba === 'modulos'" class="card">
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
      </div>

      <!-- ATIVIDADES -->
      <div v-else-if="aba === 'atividades'" class="card pad-0">
        <ActivityList :itens="atividades" />
      </div>

      <ProjectForm :open="editar" :projeto="d.projeto" @close="editar = false" @salvo="projetoSalvo" />
      <StepForm :open="novaEtapa" :projeto-id="d.projeto.id" :modulos="d.modulos" :membros="d.membros"
                :pode-disponibilizar="d.meus_papeis.includes('disponibilizador')"
                :modulo-padrao="d.modulos.find((m: any) => m.nome === filtroModulo)?.id ?? null"
                @close="novaEtapa = false" @salvo="etapaCriada" />
    </template>
  </div>
</template>

<style scoped>
.head h1 { font-size: 24px; }
.pct { font-family: var(--font-title); font-weight: 800; color: var(--navy); font-size: 18px; }
.chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: #fff; border-radius: 99px; padding: 4px 10px; font: 500 12px var(--font); color: var(--text-strong); cursor: pointer; }
.chip.on { border-color: var(--brand); background: var(--soft); }
.chip b { color: var(--navy); }
.sq { width: 9px; height: 9px; border-radius: 3px; }
.cb { width: 18px; height: 18px; accent-color: var(--brand); cursor: pointer; }
.pessoa { padding: 8px 0; border-bottom: 1px solid var(--border); }
.pessoa:last-child { border: 0; }
</style>
