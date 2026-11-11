<script setup lang="ts">
import {
  FolderKanban, PlayCircle, ListChecks, Clock3, FlaskConical, ShieldCheck, XCircle, CheckCircle2,
  ArrowRight, Wrench, Hand,
} from 'lucide-vue-next'

const me = useMe()
const d = ref<any>(null)
const carregando = ref(true)
async function carregar() {
  try { d.value = await api('/dashboard') } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)

const saudacao = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
})
const primeiroNome = computed(() => me.value?.usuario.nome.split(' ')[0] ?? '')
const tarefas = computed(() => d.value?.minhas_tarefas ?? {})
const totalStatus = computed(() => {
  const t: Record<string, number> = {}
  for (const p of d.value?.projetos ?? []) for (const [k, v] of Object.entries(p.por_status ?? {})) t[k] = (t[k] ?? 0) + (v as number)
  return t
})
const totalEtapas = computed(() => Object.values(totalStatus.value).reduce((a, b) => a + b, 0))
const donut = computed(() => {
  let acc = 0
  const partes = STATUS_ORDEM.filter((s) => totalStatus.value[s]).map((s) => {
    const ini = (acc / totalEtapas.value) * 100
    acc += totalStatus.value[s]
    return `${STATUS[s].cor} ${ini}% ${(acc / totalEtapas.value) * 100}%`
  })
  return partes.length ? `conic-gradient(${partes.join(',')})` : 'var(--soft)'
})
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>{{ saudacao }}, {{ primeiroNome }}</h1>
        <div class="sub">Visão geral dos projetos, testes e aprovações{{ me?.usuario.is_admin ? '' : ' em que você participa' }}.</div>
      </div>
    </div>

    <LoadingBox v-if="carregando" />
    <template v-else-if="d">
      <!-- Minhas tarefas -->
      <div v-if="tarefas.para_testar || tarefas.testando || tarefas.para_aprovar || tarefas.para_corrigir" class="card tarefas mb">
        <div class="section-title"><Hand :size="16" /> Suas pendências</div>
        <div class="row wrap">
          <NuxtLink v-if="tarefas.testando" to="/testes" class="tarefa exec"><FlaskConical :size="18" /><b>{{ tarefas.testando }}</b> em teste com você</NuxtLink>
          <NuxtLink v-if="tarefas.para_testar" to="/testes" class="tarefa disp"><PlayCircle :size="18" /><b>{{ tarefas.para_testar }}</b> disponíveis para testar</NuxtLink>
          <NuxtLink v-if="tarefas.para_aprovar" to="/aprovacoes" class="tarefa aguard"><ShieldCheck :size="18" /><b>{{ tarefas.para_aprovar }}</b> aguardando sua aprovação</NuxtLink>
          <NuxtLink v-if="tarefas.para_corrigir" to="/etapas?status=reprovado,em_correcao" class="tarefa corr"><Wrench :size="18" /><b>{{ tarefas.para_corrigir }}</b> para corrigir</NuxtLink>
        </div>
      </div>

      <div class="grid k4">
        <KpiCard titulo="Total de projetos" :valor="d.total_projetos" :icone="FolderKanban" to="/projetos" />
        <KpiCard titulo="Projetos em andamento" :valor="d.projetos_andamento" :icone="PlayCircle" to="/projetos" />
        <KpiCard titulo="Etapas cadastradas" :valor="d.total_etapas" :icone="ListChecks" to="/etapas" />
        <KpiCard titulo="Aguardando testes" :valor="d.aguardando_teste" :icone="Clock3" :cor="STATUS.disponibilizado.cor" :bg="STATUS.disponibilizado.bg" to="/etapas?status=disponibilizado" />
        <KpiCard titulo="Testes em execução" :valor="d.em_execucao" :icone="FlaskConical" :cor="STATUS.em_execucao.cor" :bg="STATUS.em_execucao.bg" to="/etapas?status=em_execucao" />
        <KpiCard titulo="Aguardando aprovação" :valor="d.aguardando_aprovacao" :icone="ShieldCheck" :cor="STATUS.aguardando_aprovacao.cor" :bg="STATUS.aguardando_aprovacao.bg" to="/etapas?status=aguardando_aprovacao" />
        <KpiCard titulo="Etapas reprovadas" :valor="d.reprovadas" :icone="XCircle" :cor="STATUS.reprovado.cor" :bg="STATUS.reprovado.bg" to="/etapas?status=reprovado,em_correcao" detalhe="inclui em correção" />
        <KpiCard titulo="Etapas aprovadas" :valor="d.aprovadas" :icone="CheckCircle2" :cor="STATUS.aprovado.cor" :bg="STATUS.aprovado.bg" to="/etapas?status=aprovado" />
      </div>

      <div class="grid dash2 mt">
        <div class="card">
          <div class="card-head"><h2>Conclusão por projeto</h2><NuxtLink to="/projetos" class="small">Ver projetos <ArrowRight :size="13" style="vertical-align:-2px" /></NuxtLink></div>
          <EmptyState v-if="!d.projetos.length" texto="Nenhum projeto disponível para você." />
          <NuxtLink v-for="p in d.projetos" :key="p.id" :to="'/projetos/' + p.id" class="prj">
            <ProjectIcon :src="p.icone_url" />
            <div class="grow">
              <div class="row between"><span class="strong">{{ p.nome }}</span><span class="pct">{{ p.percentual }}%</span></div>
              <div class="stack-bar mt-s">
                <span v-for="s in STATUS_ORDEM" v-show="p.por_status?.[s]" :key="s" :title="STATUS[s].label + ': ' + p.por_status?.[s]"
                      :style="{ width: (100 * (p.por_status?.[s] ?? 0) / (p.total || 1)) + '%', background: STATUS[s].cor }" />
              </div>
              <div class="small muted mt-s">{{ p.aprovadas }} de {{ p.total }} etapas aprovadas · {{ STATUS_PROJETO[p.status] }}</div>
            </div>
          </NuxtLink>
        </div>
        <div class="card">
          <div class="card-head"><h2>Etapas por status</h2></div>
          <div class="donut-wrap">
            <div class="donut" :style="{ background: donut }"><div class="furo"><b>{{ totalEtapas }}</b><span>etapas</span></div></div>
          </div>
          <div class="leg">
            <NuxtLink v-for="s in STATUS_ORDEM" :key="s" :to="'/etapas?status=' + s" class="li">
              <span class="sq" :style="{ background: STATUS[s].cor }" /> <span class="grow">{{ STATUS[s].label }}</span> <b>{{ totalStatus[s] ?? 0 }}</b>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dash2 { grid-template-columns: 1.6fr 1fr; }
@media (max-width: 1100px) { .dash2 { grid-template-columns: 1fr; } }
.tarefas { background: linear-gradient(90deg, #fff, #F3F6FF); }
.tarefa { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 10px; font-size: 13.5px; text-decoration: none !important; border: 1px solid transparent; }
.tarefa b { font-family: var(--font-title); font-size: 16px; }
.tarefa.exec { background: var(--st-exec-bg); color: var(--st-exec); }
.tarefa.disp { background: var(--st-disp-bg); color: var(--st-disp); }
.tarefa.aguard { background: var(--st-aguard-bg); color: var(--st-aguard); }
.tarefa.corr { background: var(--st-corr-bg); color: var(--st-corr); }
.tarefa:hover { border-color: currentColor; }
.prj { display: flex; gap: 14px; align-items: center; padding: 12px 8px; border-radius: 10px; text-decoration: none !important; color: inherit; }
.prj:hover { background: var(--row); }
.pct { font-family: var(--font-title); font-weight: 800; color: var(--navy); }
.donut-wrap { display: flex; justify-content: center; padding: 8px 0 16px; }
.donut { width: 170px; height: 170px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.furo { width: 110px; height: 110px; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.furo b { font-family: var(--font-title); font-size: 26px; color: var(--navy); line-height: 1; }
.furo span { font-size: 12px; color: var(--muted); }
.leg { display: flex; flex-direction: column; gap: 2px; }
.li { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: 8px; color: var(--text-strong); text-decoration: none !important; font-size: 13px; }
.li:hover { background: var(--row); }
.sq { width: 10px; height: 10px; border-radius: 3px; }
</style>
