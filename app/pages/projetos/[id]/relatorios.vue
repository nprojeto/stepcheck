<script setup lang="ts">
import { BarChart3, Download, Printer, CheckCircle2, ListChecks, XCircle, FlaskConical, Repeat } from 'lucide-vue-next'
const projeto = useProjeto()
const pid = computed(() => projeto.value!.projeto.id)
const r = ref<any>(apiCache(`/projetos/${pid.value}/relatorio`) ?? null)
const carregando = ref(!r.value)
const abertos = ref<Record<string, boolean>>({})
onMounted(async () => {
  try { r.value = await api(`/projetos/${pid.value}/relatorio`) } catch (e) { toastErro(e) } finally { carregando.value = false }
})

const fases = ['disponibilizado', 'em_execucao', 'aguardando_aprovacao', 'em_correcao']
const mediaFase = computed(() => {
  const m: Record<string, number> = {}
  for (const f of fases) {
    const v = (r.value?.etapas ?? []).map((e: any) => e.tempo_por_fase_ms?.[f]).filter((x: any) => x)
    m[f] = v.length ? v.reduce((a: number, b: number) => a + b, 0) / v.length : 0
  }
  return m
})
const imprimir = () => window.print()
const ultTeste = (e: any) => [...e.tentativas].reverse().find((t: any) => t.testador)
const ultDec = (e: any) => [...e.tentativas].reverse().find((t: any) => t.decisao)
function csvEtapas() {
  baixarCsv(`relatorio-${r.value.projeto.nome}-etapas.csv`, [
    ['Nº', 'Etapa', 'Módulo', 'Status', 'Tentativas', 'Reprovações', 'Testes concluídos', ...fases.map((f) => 'Tempo ' + STATUS[f].label + ' (h)')],
    ...r.value.etapas.map((e: any) => [e.codigo, e.nome, e.modulo, STATUS[e.status]?.label, e.tentativa_atual, e.qtd_reprovacoes, e.qtd_testes,
      ...fases.map((f) => e.tempo_por_fase_ms?.[f] ? (e.tempo_por_fase_ms[f] / 3600000).toFixed(2).replace('.', ',') : '')]),
  ])
}
function csvTentativas() {
  const l: any[] = [['Nº', 'Etapa', 'Tentativa', 'Disponibilizado por', 'Disponibilizado em', 'Testador', 'Testado em', 'Resultado', 'Aprovador', 'Decidido em', 'Decisão', 'Justificativa']]
  for (const e of r.value.etapas) for (const t of e.tentativas) {
    l.push([e.codigo, e.nome, t.numero, t.disponibilizado_por, dataHora(t.disponibilizado_em), t.testador, dataHora(t.testado_em), RESULTADO[t.resultado] ?? '', t.aprovador, dataHora(t.decidido_em), t.decisao === 'aprovado' ? 'Aprovado' : t.decisao === 'reprovado' ? 'Reprovado' : '', t.justificativa])
  }
  baixarCsv(`relatorio-${r.value.projeto.nome}-tentativas.csv`, l)
}
</script>
<template>
  <div>
    <div class="page-head no-print">
      <div><h1>Relatórios</h1><div class="sub">Rastreabilidade completa: quem disponibilizou, testou, aprovou ou reprovou, quantas tentativas e quanto tempo em cada fase.</div></div>
      <div v-if="r" class="row wrap">
        <button class="btn secondary" @click="csvEtapas"><Download :size="16" /> CSV etapas</button>
        <button class="btn secondary" @click="csvTentativas"><Download :size="16" /> CSV tentativas</button>
        <button class="btn" @click="imprimir"><Printer :size="16" /> Imprimir / PDF</button>
      </div>
    </div>
    <LoadingBox v-if="carregando" />
    <EmptyState v-else-if="!r" texto="Relatório indisponível." :icone="BarChart3" />
    <template v-else>
      <div class="print-only rel-cab">
        <img src="/img/logo-slogan-azul.png" alt="NOVALE" style="width:200px" />
        <div style="text-align:right"><b>Relatório de testes e aprovações</b><br />{{ r.projeto.nome }}<br /><small>Gerado em {{ dataHora(r.gerado_em) }}</small></div>
      </div>
      <div class="card mb">
        <div class="row top wrap">
          <div class="grow">
            <h2>{{ r.projeto.nome }}</h2>
            <div class="small muted">Responsável: {{ r.projeto.responsavel?.nome ?? '—' }} · {{ STATUS_PROJETO[r.projeto.status] }} · Gerado em {{ dataHora(r.gerado_em) }}</div>
          </div>
          <div class="pct">{{ r.resumo.percentual }}%<small>concluído</small></div>
        </div>
        <div class="progress mt"><span :style="{ width: r.resumo.percentual + '%' }" /></div>
      </div>
      <div class="grid k4 mb">
        <KpiCard titulo="Etapas" :valor="r.resumo.total_etapas" :icone="ListChecks" />
        <KpiCard titulo="Aprovadas" :valor="r.resumo.aprovadas" :icone="CheckCircle2" :cor="STATUS.aprovado.cor" :bg="STATUS.aprovado.bg" />
        <KpiCard titulo="Testes realizados" :valor="r.resumo.testes_realizados" :icone="FlaskConical" />
        <KpiCard titulo="Reprovações" :valor="r.resumo.total_reprovacoes" :icone="XCircle" :cor="STATUS.reprovado.cor" :bg="STATUS.reprovado.bg" :detalhe="'Média de ' + r.resumo.media_tentativas_aprovadas + ' tentativa(s) até aprovar'" />
      </div>
      <div class="card mb">
        <div class="section-title"><Repeat :size="15" /> Tempo médio por fase</div>
        <div class="grid k4">
          <div v-for="f in fases" :key="f" class="fase-m">
            <StatusBadge :status="f" curto />
            <div class="v">{{ duracao(mediaFase[f]) }}</div>
          </div>
        </div>
      </div>
      <div class="card pad-0">
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>Nº</th><th>Etapa</th><th>Status</th><th class="num">Tent.</th><th class="num">Reprov.</th><th>Último teste</th><th>Última decisão</th>
                <th v-for="f in fases" :key="f" class="num">{{ STATUS[f].curto }}</th></tr>
            </thead>
            <tbody>
              <template v-for="e in r.etapas" :key="e.id">
                <tr class="clickable" @click="abertos[e.id] = !abertos[e.id]">
                  <td class="muted">#{{ e.codigo }}</td>
                  <td><span class="strong">{{ e.nome }}</span><div class="small muted">{{ e.modulo }}</div></td>
                  <td><StatusBadge :status="e.status" curto /></td>
                  <td class="num">{{ e.tentativa_atual || '—' }}</td>
                  <td class="num">{{ e.qtd_reprovacoes || '—' }}</td>
                  <td class="small">
                    <template v-if="ultTeste(e)">{{ ultTeste(e).testador }}<br /><span class="muted">{{ dataHora(ultTeste(e).testado_em) }}</span></template>
                    <span v-else class="muted">—</span>
                  </td>
                  <td class="small">
                    <template v-if="ultDec(e)">
                      <span class="badge" :class="ultDec(e).decisao === 'aprovado' ? 'ok' : 'bad'">{{ ultDec(e).decisao === 'aprovado' ? 'Aprovado' : 'Reprovado' }}</span>
                      <br /><span class="muted">{{ ultDec(e).aprovador }}</span>
                    </template>
                    <span v-else class="muted">—</span>
                  </td>
                  <td v-for="f in fases" :key="f" class="num small nowrap">{{ duracao(e.tempo_por_fase_ms?.[f]) }}</td>
                </tr>
                <tr v-if="abertos[e.id]" class="det-row">
                  <td :colspan="7 + fases.length">
                    <table class="tbl sub">
                      <thead><tr><th>Tent.</th><th>Disponibilizado</th><th>Teste</th><th>Resultado</th><th>Decisão</th><th>Justificativa</th></tr></thead>
                      <tbody>
                        <tr v-for="t in e.tentativas" :key="t.numero">
                          <td>{{ t.numero }}</td>
                          <td class="small">{{ t.disponibilizado_por }}<br /><span class="muted">{{ dataHora(t.disponibilizado_em) }}</span></td>
                          <td class="small">{{ t.testador ?? '—' }}<br /><span class="muted">{{ dataHora(t.testado_em) }}</span></td>
                          <td>{{ RESULTADO[t.resultado] ?? '—' }}</td>
                          <td class="small">{{ t.decisao === 'aprovado' ? 'Aprovado' : t.decisao === 'reprovado' ? 'Reprovado' : '—' }}<span v-if="t.aprovador"> por {{ t.aprovador }}</span><br /><span class="muted">{{ dataHora(t.decidido_em) }}</span></td>
                          <td class="small pre">{{ t.justificativa ?? '' }}</td>
                        </tr>
                        <tr v-if="!e.tentativas.length"><td colspan="6" class="muted">Ainda não disponibilizada.</td></tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div class="small muted mt-s no-print">Clique em uma etapa para ver todas as tentativas.</div>
    </template>
  </div>
</template>
<style scoped>
.pct { font-family: var(--font-title); font-weight: 800; font-size: 30px; color: var(--navy); text-align: right; line-height: 1; }
.pct small { display: block; font-size: 11px; color: var(--muted); font-family: var(--font); font-weight: 500; }
.fase-m { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.fase-m .v { font-family: var(--font-title); font-weight: 800; font-size: 18px; color: var(--navy); margin-top: 8px; }
.det-row > td { background: var(--soft) !important; padding: 10px 14px !important; }
.tbl.sub thead th { background: var(--navy-2); font-size: 11px; padding: 7px 10px; }
.tbl.sub td { padding: 7px 10px; background: #fff !important; }
.rel-cab { display: none; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--navy); padding-bottom: 10px; margin-bottom: 14px; }
@media print { .rel-cab { display: flex !important; } }
</style>
