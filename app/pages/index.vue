<script setup lang="ts">
import { Plus, Search, Users, ListChecks, FolderKanban, FlaskConical, ShieldCheck, Wrench, ArrowRight } from 'lucide-vue-next'
const me = useMe()
const lista = ref<any[]>(apiCache('/projetos') ?? [])
const pend = ref<Record<string, { testar: number; testando: number; aprovar: number }>>({})
const carregando = ref(!apiCache('/projetos'))
const busca = ref('')
const filtroStatus = ref('')
const novo = ref(false)

function contarPendencias(testes: any[], aprov: any[]) {
  const p: Record<string, any> = {}
  const get = (id: string) => (p[id] ??= { testar: 0, testando: 0, aprovar: 0 })
  testes.forEach((e) => { if (e.comigo) get(e.project_id).testando++; else if (e.posso_puxar) get(e.project_id).testar++ })
  aprov.forEach((e) => { if (e.posso_decidir) get(e.project_id).aprovar++ })
  pend.value = p
}
if (apiCache('/painel/testes')) contarPendencias(apiCache('/painel/testes'), apiCache('/painel/aprovacoes') ?? [])
async function carregar() {
  try {
    const [projetos, testes, aprov] = await Promise.all([
      api<any[]>('/projetos'),
      api<any[]>('/painel/testes').catch(() => []),
      api<any[]>('/painel/aprovacoes').catch(() => []),
    ])
    lista.value = projetos
    contarPendencias(testes, aprov)
    // deixa os projetos prontos para abrir na hora
    projetos.slice(0, 8).forEach((p) => preCarregar('/projetos/' + p.id))
  } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)

const filtrados = computed(() => lista.value.filter((p) =>
  (!busca.value || p.nome.toLowerCase().includes(busca.value.toLowerCase())) && (!filtroStatus.value || p.status === filtroStatus.value)))
const corrigir = (p: any) => p.meus_papeis.includes('disponibilizador') ? (p.por_status?.reprovado ?? 0) + (p.por_status?.em_correcao ?? 0) : 0
const saudacao = computed(() => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' })
function criado(id: string) { novo.value = false; navigateTo(rotaProjeto(id, 'equipe')) }
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>{{ saudacao }}, {{ me?.usuario.nome.split(' ')[0] }}</h1>
        <div class="sub">{{ me?.usuario.is_admin ? 'Todos os projetos da plataforma.' : 'Projetos em que você participa.' }} Abra um projeto para ver etapas, testes, aprovações, relatórios e histórico.</div>
      </div>
      <button v-if="me?.usuario.is_admin" class="btn" @click="novo = true"><Plus :size="17" /> Novo projeto</button>
    </div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar projeto…" /></div>
      <select v-model="filtroStatus" class="select"><option value="">Todos os status</option><option v-for="(l, k) in STATUS_PROJETO" :key="k" :value="k">{{ l }}</option></select>
    </div>
    <LoadingBox v-if="carregando" />
    <EmptyState v-else-if="!filtrados.length" :texto="lista.length ? 'Nenhum projeto encontrado.' : (me?.usuario.is_admin ? 'Nenhum projeto cadastrado. Crie o primeiro.' : 'Você ainda não foi incluído em nenhum projeto. Procure o administrador.')" :icone="FolderKanban" />
    <div v-else class="grid k3">
      <NuxtLink v-for="p in filtrados" :key="p.id" :to="rotaProjeto(p.id)" class="card pcard">
        <div class="row top">
          <ProjectIcon :src="p.icone_url" size="lg" />
          <div class="grow" style="min-width:0">
            <h2 class="ellipsis">{{ p.nome }}</h2>
            <div class="row wrap mt-s"><span class="badge neutral">{{ STATUS_PROJETO[p.status] }}</span><RoleBadge v-for="r in p.meus_papeis" :key="r" :papel="r" /></div>
          </div>
        </div>
        <p class="desc muted mt">{{ p.descricao || 'Sem descrição.' }}</p>
        <div class="row between mt"><span class="small strong">Conclusão</span><span class="pct">{{ p.percentual }}%</span></div>
        <div class="stack-bar mt-s">
          <span v-for="s in STATUS_ORDEM" v-show="p.por_status?.[s]" :key="s" :style="{ width: (100 * (p.por_status?.[s] ?? 0) / (p.total_etapas || 1)) + '%', background: STATUS[s].cor }" :title="STATUS[s].label" />
        </div>
        <div class="row wrap mt pend">
          <span v-if="pend[p.id]?.testando" class="tag exec"><FlaskConical :size="13" /> {{ pend[p.id].testando }} em teste com você</span>
          <span v-if="pend[p.id]?.testar" class="tag disp"><FlaskConical :size="13" /> {{ pend[p.id].testar }} para testar</span>
          <span v-if="pend[p.id]?.aprovar" class="tag aguard"><ShieldCheck :size="13" /> {{ pend[p.id].aprovar }} para aprovar</span>
          <span v-if="corrigir(p)" class="tag corr"><Wrench :size="13" /> {{ corrigir(p) }} para corrigir</span>
        </div>
        <div class="row wrap mt small muted">
          <span class="row" style="gap:5px"><ListChecks :size="14" /> {{ p.total_etapas }} etapas</span>
          <span class="row" style="gap:5px"><Users :size="14" /> {{ p.participantes }}</span>
          <span class="grow" />
          <span class="abrir">Abrir <ArrowRight :size="14" /></span>
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
.pend:empty { display: none; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 99px; }
.tag.exec { background: var(--st-exec-bg); color: var(--st-exec); }
.tag.disp { background: var(--st-disp-bg); color: var(--st-disp); }
.tag.aguard { background: var(--st-aguard-bg); color: var(--st-aguard); }
.tag.corr { background: var(--st-corr-bg); color: var(--st-corr); }
.abrir { color: var(--brand); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
</style>
