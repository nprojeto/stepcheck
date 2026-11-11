<script setup lang="ts">
import {
  ArrowLeft, Send, Play, Undo2, Wrench, RotateCcw, Pencil, Trash2, Users, Save, CheckCircle2, XCircle,
  ClipboardCheck, ShieldCheck, Lock, Timer, History, Paperclip, FileText, ListChecks, Info, MinusCircle, ChevronDown,
} from 'lucide-vue-next'

const route = useRoute()
const id = computed(() => route.params.etapa as string)
const d = ref<any>(null)
const proj = useProjeto()
const carregando = ref(true)
function doCache() {
  const c = apiCache('/etapas/' + route.params.etapa)
  if (c) { d.value = c; carregando.value = false }
}
const ocupado = ref(false)

async function carregar() {
  try {
    d.value = await api('/etapas/' + id.value)
    // prepara o formulário só quando muda a execução (não apaga o que está sendo digitado)
    if (d.value?.execucao_atual && d.value.pode.registrar_teste && formExec.value !== d.value.execucao_atual.id) prepararTeste()
    if (!d.value?.execucao_atual) formExec.value = ''
  } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(() => { doCache(); carregar() })
watch(id, () => { d.value = null; carregando.value = true; doCache(); carregar() })

const e = computed(() => d.value?.etapa)
const pode = computed(() => d.value?.pode ?? {})

async function acao(nome: string, extra: Record<string, any> = {}, msg = 'Ação registrada.') {
  ocupado.value = true
  try {
    await api(`/etapas/${id.value}/acao`, { method: 'POST', body: { acao: nome, ...extra } })
    toast(msg)
    modal.value = ''
    await carregar()
    carregarProjeto(e.value.project_id).catch(() => {})
    loadMe().catch(() => {})
    return true
  } catch (err) { toastErro(err); return false } finally { ocupado.value = false }
}

// ---------- Modais simples ----------
const modal = ref('')
const texto = ref('')
function abrir(m: string) { texto.value = ''; modal.value = m }

// ---------- Registro do teste ----------
const t = reactive<any>({ procedimentos: '', descricao: '', resultado: '', criterios: [] as any[] })
const formExec = ref('')
function prepararTeste() {
  const x = d.value.execucao_atual
  formExec.value = x.id
  t.procedimentos = x.procedimentos ?? ''
  t.descricao = x.descricao ?? ''
  t.resultado = x.resultado ?? ''
  t.criterios = (x.criterios ?? []).map((c: any) => ({ id: c.id, texto: c.criterio_texto, resultado: c.resultado ?? '', observacao: c.observacao ?? '' }))
}
const pendentes = computed(() => t.criterios.filter((c: any) => !c.resultado).length)
const falhas = computed(() => t.criterios.filter((c: any) => c.resultado === 'falhou').length)
watch(falhas, (n) => { if (n > 0 && t.resultado === 'sucesso') t.resultado = 'com_problemas' })
const corpoTeste = () => ({
  procedimentos: t.procedimentos, descricao: t.descricao, resultado: t.resultado || null,
  criterios: t.criterios.map((c: any) => ({ id: c.id, resultado: c.resultado || null, observacao: c.observacao })),
})
async function salvarRascunho() { await acao('salvar_teste', corpoTeste(), 'Rascunho salvo.') }
async function enviarAprovacao() {
  if (pendentes.value) return toast(`Avalie todos os critérios (${pendentes.value} pendente(s)).`, 'erro')
  if (!t.resultado) return toast('Informe o resultado do teste.', 'erro')
  if (!confirm('Enviar o resultado para aprovação? Depois de enviado, o teste não poderá mais ser alterado.')) return
  await acao('enviar_aprovacao', corpoTeste(), 'Teste enviado para aprovação.')
}

// ---------- Decisão ----------
const dec = reactive({ justificativa: '', observacoes: '' })
async function decidir(tipo: 'aprovar' | 'reprovar') {
  if (tipo === 'reprovar' && dec.justificativa.trim().length < 5) return toast('A justificativa é obrigatória para reprovar.', 'erro')
  if (!confirm(tipo === 'aprovar' ? 'Confirmar a APROVAÇÃO desta etapa?' : 'Confirmar a REPROVAÇÃO? A etapa volta para a equipe de disponibilização.')) return
  const ok = await acao(tipo, { justificativa: dec.justificativa, observacoes: dec.observacoes }, tipo === 'aprovar' ? 'Etapa aprovada.' : 'Etapa reprovada e devolvida para correção.')
  if (ok) { dec.justificativa = ''; dec.observacoes = '' }
}
const ultimaExec = computed(() => [...(d.value?.execucoes ?? [])].reverse().find((x: any) => x.situacao === 'concluido'))
const euTestei = computed(() => e.value?.status === 'aguardando_aprovacao' && ultimaExec.value?.testador_id === useMe().value?.usuario.id)

// ---------- Exclusão ----------
async function excluir() {
  if (!confirm('Excluir esta etapa? Esta ação não pode ser desfeita.')) return
  try { await api('/etapas/' + id.value, { method: 'DELETE' }); toast('Etapa excluída.'); carregarProjeto(e.value.project_id).catch(() => {}); navigateTo(rotaProjeto(e.value.project_id, 'etapas')) } catch (err) { toastErro(err) }
}

// ---------- Tentativas (histórico) ----------
const tentativas = computed(() => {
  if (!d.value) return []
  return [...d.value.tentativas].reverse().map((a: any) => ({
    ...a,
    execucoes: d.value.execucoes.filter((x: any) => x.attempt_id === a.id),
    decisao: d.value.decisoes.find((x: any) => x.attempt_id === a.id),
    anexosDecisao: d.value.anexos.filter((x: any) => x.attempt_id === a.id && x.contexto === 'decisao'),
  }))
})
const abertas = ref<Record<string, boolean>>({})
const anexosExec = (exId: string) => d.value.anexos.filter((a: any) => a.execution_id === exId)
const anexosEtapa = computed(() => (d.value?.anexos ?? []).filter((a: any) => a.contexto === 'etapa' || a.contexto === 'tentativa'))
const anexosDecisaoAtual = computed(() => {
  const att = d.value?.tentativas.find((a: any) => a.numero === e.value?.tentativa_atual)
  return (d.value?.anexos ?? []).filter((a: any) => a.contexto === 'decisao' && a.attempt_id === att?.id && !d.value.decisoes.some((x: any) => x.attempt_id === att?.id))
})

// ---------- Responsáveis ----------
const resp = (p: string) => (d.value?.responsaveis ?? []).filter((r: any) => r.papel === p)
const doProjeto = (p: string) => (proj.value?.membros ?? []).filter((m: any) => m.papel === p)

const editar = ref(false)
const isAdmin = computed(() => !!useMe().value?.usuario.is_admin)
const editarResp = ref(false)
function salvoForm() { editar.value = false; editarResp.value = false; carregar(); carregarProjeto(e.value.project_id).catch(() => {}) }
const fasesOrdenadas = computed(() => STATUS_ORDEM.filter((s) => d.value?.tempo_por_fase_ms?.[s]))
const totalMs = computed(() => Object.values(d.value?.tempo_por_fase_ms ?? {}).reduce((a: number, b: any) => a + b, 0))
</script>

<template>
  <div>
    <LoadingBox v-if="carregando" />
    <template v-else-if="d">
      <NuxtLink :to="rotaProjeto(e.project_id, 'etapas')" class="small row" style="gap:4px;margin-bottom:10px"><ArrowLeft :size="14" /> Etapas</NuxtLink>

      <!-- Cabeçalho -->
      <div class="card mb">
        <div class="row top wrap">
          <div class="grow">
            <div class="small muted">{{ d.modulo?.nome ?? 'Sem módulo' }}</div>
            <h1 class="mt-s">#{{ e.codigo }} · {{ e.nome }}</h1>
            <div class="row wrap mt-s">
              <StatusBadge :status="e.status" />
              <span class="badge neutral">Tentativa {{ e.tentativa_atual || '—' }}</span>
              <span class="small muted">desde {{ dataHora(e.status_desde) }} ({{ relativo(e.status_desde) }})</span>
              <span v-if="e.testador_atual_nome" class="badge warn"><Lock :size="12" /> Em teste com {{ e.testador_atual_nome }}</span>
            </div>
          </div>
        </div>
        <div class="row wrap acoes mt">
          <button v-if="pode.iniciar_teste" class="btn" :disabled="ocupado" @click="acao('iniciar_teste', {}, 'Teste iniciado. A etapa está reservada para você.')"><Play :size="16" /> Iniciar teste</button>
          <button v-if="pode.disponibilizar" class="btn" @click="abrir('disponibilizar')"><Send :size="16" /> {{ e.status === 'em_correcao' ? 'Redisponibilizar para teste' : 'Disponibilizar para teste' }}</button>
          <button v-if="pode.iniciar_correcao" class="btn warn" :disabled="ocupado" @click="acao('iniciar_correcao', {}, 'Correção iniciada.')"><Wrench :size="16" /> Iniciar correção</button>
          <button v-if="pode.editar" class="btn secondary" @click="editar = true"><Pencil :size="16" /> Editar etapa</button>
          <button v-if="pode.editar_responsaveis && !pode.editar" class="btn secondary" @click="editarResp = true"><Users :size="16" /> Responsáveis</button>
          <button v-if="pode.devolver_teste" class="btn secondary" @click="abrir('devolver')"><Undo2 :size="16" /> Devolver à fila</button>
          <button v-if="pode.reabrir" class="btn secondary" @click="abrir('reabrir')"><RotateCcw :size="16" /> Reabrir</button>
          <button v-if="pode.excluir" class="btn ghost" @click="excluir"><Trash2 :size="16" /> Excluir</button>
        </div>
        <div v-if="e.status === 'reprovado' && d.decisoes.length" class="alert danger mt">
          <XCircle :size="18" />
          <div><b>Reprovada por {{ d.decisoes[d.decisoes.length - 1].aprovador_nome }}:</b> <span class="pre">{{ d.decisoes[d.decisoes.length - 1].justificativa }}</span></div>
        </div>
        <div v-if="e.status === 'em_correcao'" class="alert warn mt"><Wrench :size="18" /><span>Etapa em correção. Ao terminar, clique em <b>Redisponibilizar para teste</b> e descreva o que foi corrigido.</span></div>
        <div v-if="euTestei" class="alert info mt"><Info :size="18" /><span>Você executou este teste e, por isso, não pode aprovar ou reprovar esta tentativa.</span></div>
      </div>

      <!-- Registro do teste -->
      <div v-if="pode.registrar_teste" class="card destaque exec mb">
        <div class="card-head">
          <h2><ClipboardCheck :size="20" /> Registro do teste — tentativa {{ e.tentativa_atual }}</h2>
          <span class="small muted">Iniciado em {{ dataHora(d.execucao_atual?.iniciado_em) }}</span>
        </div>
        <div class="section-title">Critérios de aprovação</div>
        <div class="crit-list">
          <div v-for="(c, i) in t.criterios" :key="c.id" class="crit-row" :class="c.resultado">
            <div class="row top">
              <span class="n">{{ i + 1 }}</span>
              <div class="grow pre">{{ c.texto }}</div>
              <div class="seg">
                <button :class="{ on: c.resultado === 'ok' }" class="ok" @click="c.resultado = 'ok'"><CheckCircle2 :size="15" /> OK</button>
                <button :class="{ on: c.resultado === 'falhou' }" class="falhou" @click="c.resultado = 'falhou'"><XCircle :size="15" /> Falhou</button>
                <button :class="{ on: c.resultado === 'na' }" class="na" @click="c.resultado = 'na'"><MinusCircle :size="15" /> N/A</button>
              </div>
            </div>
            <input v-model="c.observacao" class="input sm mt-s" placeholder="Observação (opcional)" />
          </div>
        </div>
        <div class="grid k2 mt">
          <div class="field"><label class="req">Procedimentos realizados</label><textarea v-model="t.procedimentos" class="textarea" rows="5" placeholder="Passo a passo do que foi testado, dispositivo, ambiente, dados usados…" /></div>
          <div class="field"><label class="req">Descrição dos resultados</label><textarea v-model="t.descricao" class="textarea" rows="5" placeholder="O que aconteceu, problemas encontrados, comportamento observado…" /></div>
        </div>
        <div class="field">
          <label class="req">Resultado do teste</label>
          <div class="row wrap">
            <label class="res" :class="{ on: t.resultado === 'sucesso', dis: falhas > 0 }"><input v-model="t.resultado" type="radio" value="sucesso" :disabled="falhas > 0" /> <CheckCircle2 :size="17" /> Bem-sucedido</label>
            <label class="res bad" :class="{ on: t.resultado === 'com_problemas' }"><input v-model="t.resultado" type="radio" value="com_problemas" /> <XCircle :size="17" /> Apresentou problemas</label>
          </div>
          <span v-if="falhas" class="hint">{{ falhas }} critério(s) falharam: o resultado deve ser "Apresentou problemas".</span>
        </div>
        <div class="section-title mt"><Paperclip :size="15" /> Evidências (prints, vídeos, documentos)</div>
        <AttachmentList :anexos="anexosExec(d.execucao_atual.id)" :step-id="e.id" contexto="teste" pode-enviar @enviado="carregar" />
        <div class="row wrap end mt">
          <span v-if="pendentes" class="small muted grow">{{ pendentes }} critério(s) sem avaliação</span>
          <button class="btn secondary" :disabled="ocupado" @click="salvarRascunho"><Save :size="16" /> Salvar rascunho</button>
          <button class="btn" :disabled="ocupado" @click="enviarAprovacao"><Send :size="16" /> Enviar para aprovação</button>
        </div>
      </div>

      <!-- Decisão -->
      <div v-if="pode.decidir && ultimaExec" class="card destaque aguard mb">
        <div class="card-head"><h2><ShieldCheck :size="20" /> Análise para aprovação — tentativa {{ e.tentativa_atual }}</h2></div>
        <div class="kv mb">
          <div class="k">Testador</div><div class="v">{{ ultimaExec.testador_nome }}</div>
          <div class="k">Testado em</div><div class="v">{{ dataHora(ultimaExec.concluido_em) }}</div>
          <div class="k">Resultado</div><div class="v"><span class="badge" :class="ultimaExec.resultado === 'sucesso' ? 'ok' : 'bad'">{{ RESULTADO[ultimaExec.resultado] }}</span></div>
          <div class="k">Procedimentos</div><div class="v pre">{{ ultimaExec.procedimentos }}</div>
          <div class="k">Resultados</div><div class="v pre">{{ ultimaExec.descricao }}</div>
        </div>
        <ExecCriteria :criterios="ultimaExec.criterios" />
        <div class="section-title mt"><Paperclip :size="15" /> Evidências do teste</div>
        <AttachmentList :anexos="anexosExec(ultimaExec.id)" />
        <div class="grid k2 mt">
          <div class="field"><label>Observações</label><textarea v-model="dec.observacoes" class="textarea" rows="3" /></div>
          <div class="field"><label>Justificativa <span class="muted">(obrigatória para reprovar)</span></label><textarea v-model="dec.justificativa" class="textarea" rows="3" placeholder="Por que está sendo reprovada? O que precisa ser corrigido?" /></div>
        </div>
        <div class="section-title"><Paperclip :size="15" /> Anexos da análise</div>
        <AttachmentList :anexos="anexosDecisaoAtual" :step-id="e.id" contexto="decisao" pode-enviar @enviado="carregar" />
        <div class="row wrap end mt">
          <button class="btn danger" :disabled="ocupado" @click="decidir('reprovar')"><XCircle :size="16" /> Reprovar</button>
          <button class="btn success" :disabled="ocupado" @click="decidir('aprovar')"><CheckCircle2 :size="16" /> Aprovar</button>
        </div>
      </div>

      <div class="grid det">
        <div class="col" style="gap:16px">
          <div class="card">
            <div class="section-title"><FileText :size="15" /> Descrição</div>
            <p class="pre">{{ e.descricao || 'Sem descrição.' }}</p>
            <div class="section-title mt"><ListChecks :size="15" /> Critérios de aprovação ({{ d.criterios.length }})</div>
            <ol class="crit-ol">
              <li v-for="c in d.criterios" :key="c.id" class="pre">{{ c.texto }}</li>
            </ol>
          </div>

          <div class="card">
            <div class="section-title"><History :size="15" /> Tentativas, testes e decisões</div>
            <EmptyState v-if="!tentativas.length" texto="A etapa ainda não foi disponibilizada para teste." />
            <div v-for="a in tentativas" :key="a.id" class="tent">
              <button class="tent-head" @click="abertas[a.id] = !(abertas[a.id] ?? a.numero === e.tentativa_atual)">
                <span class="tn">{{ a.numero }}</span>
                <div class="grow" style="text-align:left">
                  <div class="strong">Tentativa {{ a.numero }}</div>
                  <div class="small muted">Disponibilizada por {{ a.disponibilizado_por_nome }} em {{ dataHora(a.disponibilizado_em) }}</div>
                </div>
                <span v-if="a.decisao" class="badge" :class="a.decisao.decisao === 'aprovado' ? 'ok' : 'bad'">{{ a.decisao.decisao === 'aprovado' ? 'Aprovada' : 'Reprovada' }}</span>
                <span v-else class="badge neutral">Em andamento</span>
                <ChevronDown :size="16" :class="{ rot: abertas[a.id] ?? a.numero === e.tentativa_atual }" />
              </button>
              <div v-if="abertas[a.id] ?? a.numero === e.tentativa_atual" class="tent-body">
                <div v-if="a.notas" class="small mb-s"><b>Notas da disponibilização:</b> <span class="pre">{{ a.notas }}</span></div>
                <div v-for="x in a.execucoes" :key="x.id" class="exec-box">
                  <div class="row wrap between">
                    <div><b class="strong">Teste de {{ x.testador_nome }}</b> <span class="small muted">· {{ dataHora(x.iniciado_em) }} → {{ dataHora(x.concluido_em) }}</span></div>
                    <span v-if="x.situacao === 'devolvido'" class="badge neutral">Devolvido à fila</span>
                    <span v-else-if="x.situacao === 'em_andamento'" class="badge warn">Em andamento</span>
                    <span v-else class="badge" :class="x.resultado === 'sucesso' ? 'ok' : 'bad'">{{ RESULTADO[x.resultado] }}</span>
                  </div>
                  <div v-if="x.motivo_devolucao" class="small mt-s"><b>Motivo da devolução:</b> {{ x.motivo_devolucao }}</div>
                  <template v-if="x.situacao === 'concluido'">
                    <div class="small mt-s"><b>Procedimentos:</b> <span class="pre">{{ x.procedimentos }}</span></div>
                    <div class="small mt-s"><b>Resultados:</b> <span class="pre">{{ x.descricao }}</span></div>
                    <ExecCriteria :criterios="x.criterios" class="mt-s" />
                    <AttachmentList v-if="anexosExec(x.id).length" :anexos="anexosExec(x.id)" compacto class="mt-s" />
                  </template>
                </div>
                <div v-if="a.decisao" class="dec-box" :class="a.decisao.decisao">
                  <div class="row wrap between">
                    <b>{{ a.decisao.decisao === 'aprovado' ? 'Aprovada' : 'Reprovada' }} por {{ a.decisao.aprovador_nome }}</b>
                    <span class="small muted">{{ dataHora(a.decisao.decidido_em) }}</span>
                  </div>
                  <div v-if="a.decisao.justificativa" class="small mt-s"><b>Justificativa:</b> <span class="pre">{{ a.decisao.justificativa }}</span></div>
                  <div v-if="a.decisao.observacoes" class="small mt-s"><b>Observações:</b> <span class="pre">{{ a.decisao.observacoes }}</span></div>
                  <AttachmentList v-if="a.anexosDecisao.length" :anexos="a.anexosDecisao" compacto class="mt-s" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col" style="gap:16px">
          <div class="card">
            <div class="card-head" style="margin-bottom:8px"><div class="section-title" style="margin:0"><Users :size="15" /> Responsáveis</div>
              <button v-if="pode.editar_responsaveis" class="btn ghost sm" @click="pode.editar ? (editar = true) : (editarResp = true)"><Pencil :size="13" /> Alterar</button></div>
            <div class="small strong">Disponibilização</div>
            <div class="small mb-s">{{ (proj?.membros ?? []).filter((m: any) => m.papel === 'disponibilizador').map((m: any) => m.nome).join(', ') || '—' }}</div>
            <div class="small strong">Testadores</div>
            <div class="small mb-s">{{ resp('testador').length ? resp('testador').map((r: any) => r.nome).join(', ') : (doProjeto('testador').map((m: any) => m.nome).join(', ') || '—') }}
              <span v-if="!resp('testador').length" class="muted">(todos do projeto)</span></div>
            <div class="small strong">Aprovadores</div>
            <div class="small">{{ resp('aprovador').length ? resp('aprovador').map((r: any) => r.nome).join(', ') : (doProjeto('aprovador').map((m: any) => m.nome).join(', ') || '—') }}
              <span v-if="!resp('aprovador').length" class="muted">(todos do projeto)</span></div>
          </div>

          <div class="card">
            <div class="section-title"><Paperclip :size="15" /> Documentos da etapa</div>
            <AttachmentList :anexos="anexosEtapa" :step-id="e.id" contexto="etapa" :pode-enviar="(d.meus_papeis.includes('disponibilizador') || isAdmin) && e.status !== 'aprovado'" @enviado="carregar" />
          </div>

          <div class="card">
            <div class="section-title"><Timer :size="15" /> Tempo em cada fase</div>
            <div v-for="s in fasesOrdenadas" :key="s" class="fase">
              <div class="row between small"><span>{{ STATUS[s].label }}</span><b class="strong">{{ duracao(d.tempo_por_fase_ms[s]) }}</b></div>
              <div class="progress mt-s"><span :style="{ width: (100 * d.tempo_por_fase_ms[s] / (totalMs || 1)) + '%', background: STATUS[s].cor }" /></div>
            </div>
            <div class="row between small mt"><span class="muted">Total</span><b>{{ duracao(totalMs) }}</b></div>
          </div>

          <div class="card">
            <div class="section-title"><History :size="15" /> Linha do tempo</div>
            <div class="timeline">
              <div v-for="h in [...d.historico].reverse()" :key="h.id" class="tl-item">
                <span class="tl-dot" :style="{ background: STATUS[h.para]?.cor }" />
                <div class="row wrap" style="gap:6px"><StatusBadge :status="h.para" curto /></div>
                <div class="small mt-s">{{ h.motivo }}</div>
                <div class="small muted">{{ h.por_nome ?? '—' }} · {{ dataHora(h.em) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modais -->
      <AppModal :open="modal === 'disponibilizar'" :titulo="e.status === 'em_correcao' ? 'Redisponibilizar para teste' : 'Disponibilizar para teste'" @close="modal = ''">
        <p class="muted">A etapa ficará disponível para os testadores puxarem. Será criada a tentativa {{ e.tentativa_atual + 1 }}.</p>
        <div class="field"><label :class="{ req: e.status === 'em_correcao' }">{{ e.status === 'em_correcao' ? 'O que foi corrigido' : 'Observações para os testadores' }}</label><textarea v-model="texto" class="textarea" rows="4" /></div>
        <template #footer>
          <button class="btn secondary" @click="modal = ''">Cancelar</button>
          <button class="btn" :disabled="ocupado" @click="acao('disponibilizar', { notas: texto }, 'Etapa disponibilizada para teste.')"><Send :size="16" /> Disponibilizar</button>
        </template>
      </AppModal>
      <AppModal :open="modal === 'devolver'" titulo="Devolver à fila de testes" @close="modal = ''">
        <p class="muted">A etapa volta a ficar disponível para outro testador. O registro deste teste é mantido no histórico.</p>
        <div class="field"><label>Motivo</label><textarea v-model="texto" class="textarea" rows="3" /></div>
        <template #footer>
          <button class="btn secondary" @click="modal = ''">Cancelar</button>
          <button class="btn" :disabled="ocupado" @click="acao('devolver_teste', { motivo: texto }, 'Etapa devolvida à fila.')"><Undo2 :size="16" /> Devolver</button>
        </template>
      </AppModal>
      <AppModal :open="modal === 'reabrir'" titulo="Reabrir etapa aprovada" @close="modal = ''">
        <p class="muted">A etapa volta para "Em correção". A aprovação anterior continua registrada no histórico.</p>
        <div class="field"><label class="req">Motivo da reabertura</label><textarea v-model="texto" class="textarea" rows="3" /></div>
        <template #footer>
          <button class="btn secondary" @click="modal = ''">Cancelar</button>
          <button class="btn warn" :disabled="ocupado" @click="acao('reabrir', { motivo: texto }, 'Etapa reaberta.')"><RotateCcw :size="16" /> Reabrir</button>
        </template>
      </AppModal>
      <StepForm v-if="proj" :open="editar || editarResp" :projeto-id="e.project_id" :etapa="e" :criterios-atuais="d.criterios" :responsaveis-atuais="d.responsaveis"
                :modulos="proj.modulos" :membros="proj.membros" :somente-responsaveis="editarResp" @close="editar = false; editarResp = false" @salvo="salvoForm" />
    </template>
  </div>
</template>

<style scoped>
.acoes { padding-top: 14px; border-top: 1px solid var(--border); }
.acoes:empty { display: none; }
.destaque { border-width: 2px; }
.destaque.exec { border-color: #F3C98B; background: linear-gradient(180deg, #FFFBF4, #fff 140px); }
.destaque.aguard { border-color: #CDB6F7; background: linear-gradient(180deg, #FAF6FF, #fff 140px); }
.destaque h2 { color: var(--navy); }
.crit-list { display: flex; flex-direction: column; gap: 8px; }
.crit-row { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: #fff; border-left: 4px solid var(--border); }
.crit-row.ok { border-left-color: var(--ok); } .crit-row.falhou { border-left-color: var(--danger); } .crit-row.na { border-left-color: var(--muted); }
.n { width: 24px; height: 24px; border-radius: 50%; background: var(--navy); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.seg button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: #fff; padding: 6px 10px; font: 600 12.5px var(--font); color: var(--muted); cursor: pointer; border-right: 1px solid var(--border); }
.seg button:last-child { border-right: 0; }
.seg button.ok.on { background: var(--st-aprov-bg); color: var(--ok); }
.seg button.falhou.on { background: var(--st-reprov-bg); color: var(--danger); }
.seg button.na.on { background: var(--soft); color: var(--navy); }
@media (max-width: 640px) { .crit-row > .row { flex-wrap: wrap; } .seg { width: 100%; } .seg button { flex: 1; justify-content: center; } }
.res { display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--border); border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600; color: var(--muted); background: #fff; }
.res input { display: none; }
.res.on { border-color: var(--ok); color: var(--ok); background: var(--st-aprov-bg); }
.res.bad.on { border-color: var(--danger); color: var(--danger); background: var(--st-reprov-bg); }
.res.dis { opacity: .5; cursor: not-allowed; }
.det { grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr); }
@media (max-width: 1100px) { .det { grid-template-columns: 1fr; } }
.crit-ol { margin: 0; padding-left: 22px; } .crit-ol li { padding: 5px 0; border-bottom: 1px dashed var(--border); color: var(--text-strong); } .crit-ol li:last-child { border: 0; }
.tent { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
.tent-head { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; background: var(--row); padding: 10px 12px; cursor: pointer; font-family: var(--font); }
.tent-head .rot { transform: rotate(180deg); }
.tn { width: 30px; height: 30px; border-radius: 8px; background: var(--navy); color: #fff; font-family: var(--font-title); font-weight: 800; display: flex; align-items: center; justify-content: center; }
.tent-body { padding: 12px; }
.exec-box { border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; margin-bottom: 8px; background: #fff; }
.dec-box { border-radius: 9px; padding: 10px 12px; }
.dec-box.aprovado { background: var(--st-aprov-bg); color: #14532D; }
.dec-box.reprovado { background: var(--st-reprov-bg); color: #7F1D1D; }
.fase { margin-bottom: 10px; }
</style>
