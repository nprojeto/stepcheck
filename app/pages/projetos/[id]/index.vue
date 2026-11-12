<script setup lang="ts">
import { ListChecks, Clock3, FlaskConical, ShieldCheck, XCircle, CheckCircle2, FileEdit, Hand, Wrench, PlayCircle, ArrowRight, Layers, History } from 'lucide-vue-next'
const projeto = useProjeto()
const pid = computed(() => projeto.value!.projeto.id)
const pend = ref({ testar: 0, testando: 0, aprovar: 0 })
const atividades = ref<any[]>(apiCache('/historico', { project_id: pid.value, limit: 8 })?.itens ?? [])
function contar(t: any[], aprov: any[]) {
  pend.value = {
    testando: t.filter((e) => e.comigo).length,
    testar: t.filter((e) => e.posso_puxar).length,
    aprovar: aprov.filter((e) => e.posso_decidir).length,
  }
}
if (apiCache('/painel/testes', { project_id: pid.value })) contar(apiCache('/painel/testes', { project_id: pid.value }), apiCache('/painel/aprovacoes', { project_id: pid.value }) ?? [])

async function carregarExtras() {
  try {
    const [testes, aprov, hist] = await Promise.all([
      api<any[]>('/painel/testes', { query: { project_id: pid.value } }).catch(() => []),
      api<any[]>('/painel/aprovacoes', { query: { project_id: pid.value } }).catch(() => []),
      api<any>('/historico', { query: { project_id: pid.value, limit: 8 } }).catch(() => ({ itens: [] })),
    ])
    contar(testes, aprov)
    atividades.value = hist.itens
  } catch (e) { toastErro(e) }
}
onMounted(carregarExtras)

const etapas = computed(() => projeto.value?.etapas ?? [])
const porStatus = computed(() => {
  const t: Record<string, number> = {}
  for (const e of etapas.value) t[e.status] = (t[e.status] ?? 0) + 1
  return t
})
const total = computed(() => etapas.value.length)
const corrigir = computed(() => (projeto.value?.meus_papeis.includes('disponibilizador') || projeto.value?.pode.admin_projeto) ? (porStatus.value.reprovado ?? 0) + (porStatus.value.em_correcao ?? 0) : 0)
const temPendencia = computed(() => pend.value.testar || pend.value.testando || pend.value.aprovar || corrigir.value)
const modulos = computed(() => {
  const m: { nome: string; total: number; aprov: number; por: Record<string, number> }[] = []
  for (const e of etapas.value) {
    const nome = e.modulo ?? 'Sem módulo'
    let x = m.find((y) => y.nome === nome)
    if (!x) { x = { nome, total: 0, aprov: 0, por: {} }; m.push(x) }
    x.total++; if (e.status === 'aprovado') x.aprov++
    x.por[e.status] = (x.por[e.status] ?? 0) + 1
  }
  return m
})
const donut = computed(() => {
  let acc = 0
  const partes = STATUS_ORDEM.filter((s) => porStatus.value[s]).map((s) => {
    const ini = (acc / total.value) * 100
    acc += porStatus.value[s]
    return `${STATUS[s].cor} ${ini}% ${(acc / total.value) * 100}%`
  })
  return partes.length ? `conic-gradient(${partes.join(',')})` : 'var(--soft)'
})
const r = (sub: string) => rotaProjeto(pid.value, sub)
</script>

<template>
  <div v-if="projeto">
    <div v-if="temPendencia" class="card tarefas mb">
      <div class="section-title"><Hand :size="16" /> Suas pendências neste projeto</div>
      <div class="row wrap">
        <NuxtLink v-if="pend.testando" :to="r('testes')" class="tarefa exec"><FlaskConical :size="18" /><b>{{ pend.testando }}</b> em teste com você</NuxtLink>
        <NuxtLink v-if="pend.testar" :to="r('testes')" class="tarefa disp"><PlayCircle :size="18" /><b>{{ pend.testar }}</b> disponíveis para testar</NuxtLink>
        <NuxtLink v-if="pend.aprovar" :to="r('aprovacoes')" class="tarefa aguard"><ShieldCheck :size="18" /><b>{{ pend.aprovar }}</b> aguardando sua aprovação</NuxtLink>
        <NuxtLink v-if="corrigir" :to="r('etapas') + '?status=reprovado,em_correcao'" class="tarefa corr"><Wrench :size="18" /><b>{{ corrigir }}</b> para corrigir</NuxtLink>
      </div>
    </div>

    <div class="grid k4">
      <KpiCard titulo="Etapas cadastradas" :valor="total" :icone="ListChecks" :to="r('etapas')" />
      <KpiCard titulo="Em elaboração" :valor="porStatus.em_elaboracao ?? 0" :icone="FileEdit" :cor="STATUS.em_elaboracao.cor" :bg="STATUS.em_elaboracao.bg" :to="r('etapas') + '?status=em_elaboracao'" />
      <KpiCard titulo="Aguardando testes" :valor="porStatus.disponibilizado ?? 0" :icone="Clock3" :cor="STATUS.disponibilizado.cor" :bg="STATUS.disponibilizado.bg" :to="r('etapas') + '?status=disponibilizado'" />
      <KpiCard titulo="Testes em execução" :valor="porStatus.em_execucao ?? 0" :icone="FlaskConical" :cor="STATUS.em_execucao.cor" :bg="STATUS.em_execucao.bg" :to="r('etapas') + '?status=em_execucao'" />
      <KpiCard titulo="Aguardando aprovação" :valor="porStatus.aguardando_aprovacao ?? 0" :icone="ShieldCheck" :cor="STATUS.aguardando_aprovacao.cor" :bg="STATUS.aguardando_aprovacao.bg" :to="r('etapas') + '?status=aguardando_aprovacao'" />
      <KpiCard titulo="Reprovadas" :valor="porStatus.reprovado ?? 0" :icone="XCircle" :cor="STATUS.reprovado.cor" :bg="STATUS.reprovado.bg" :to="r('etapas') + '?status=reprovado'" />
      <KpiCard titulo="Em correção" :valor="porStatus.em_correcao ?? 0" :icone="Wrench" :cor="STATUS.em_correcao.cor" :bg="STATUS.em_correcao.bg" :to="r('etapas') + '?status=em_correcao'" />
      <KpiCard titulo="Aprovadas" :valor="porStatus.aprovado ?? 0" :icone="CheckCircle2" :cor="STATUS.aprovado.cor" :bg="STATUS.aprovado.bg" :to="r('etapas') + '?status=aprovado'" />
    </div>

    <div class="grid dash2 mt">
      <div class="card">
        <div class="card-head"><h2><Layers :size="18" /> Andamento por módulo</h2><NuxtLink :to="r('etapas')" class="small">Ver etapas <ArrowRight :size="13" style="vertical-align:-2px" /></NuxtLink></div>
        <EmptyState v-if="!modulos.length" texto="Nenhuma etapa cadastrada." />
        <div v-for="m in modulos" :key="m.nome" class="mod">
          <div class="row between"><span class="strong">{{ m.nome }}</span><span class="small"><b>{{ m.aprov }}</b>/{{ m.total }} aprovadas</span></div>
          <div class="stack-bar mt-s">
            <span v-for="s in STATUS_ORDEM" v-show="m.por[s]" :key="s" :title="STATUS[s].label + ': ' + m.por[s]" :style="{ width: (100 * (m.por[s] ?? 0) / m.total) + '%', background: STATUS[s].cor }" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Etapas por status</h2></div>
        <div class="donut-wrap"><div class="donut" :style="{ background: donut }"><div class="furo"><b>{{ total }}</b><span>etapas</span></div></div></div>
        <div class="leg">
          <NuxtLink v-for="s in STATUS_ORDEM" :key="s" :to="r('etapas') + '?status=' + s" class="li">
            <span class="sq" :style="{ background: STATUS[s].cor }" /> <span class="grow">{{ STATUS[s].label }}</span> <b>{{ porStatus[s] ?? 0 }}</b>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="card pad-0 mt">
      <div class="card-head" style="padding:16px 18px 0"><h2><History :size="18" /> Últimas atividades</h2><NuxtLink :to="r('historico')" class="small">Ver histórico completo <ArrowRight :size="13" style="vertical-align:-2px" /></NuxtLink></div>
      <ActivityList :itens="atividades" />
    </div>
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
.mod { padding: 10px 0; border-bottom: 1px solid var(--border); }
.mod:last-child { border: 0; }
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
