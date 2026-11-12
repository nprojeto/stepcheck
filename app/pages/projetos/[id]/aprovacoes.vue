<script setup lang="ts">
import { ShieldCheck, ArrowRight } from 'lucide-vue-next'
const projeto = useProjeto()
const pid = computed(() => projeto.value!.projeto.id)
const lista = ref<any[]>(apiCache('/painel/aprovacoes', { project_id: pid.value }) ?? [])
const carregando = ref(!apiCache('/painel/aprovacoes', { project_id: pid.value }))
onMounted(async () => {
  try { lista.value = await api<any[]>('/painel/aprovacoes', { query: { project_id: pid.value } }) }
  catch (e) { toastErro(e) } finally { carregando.value = false }
})
const minhas = computed(() => lista.value.filter((e) => e.posso_decidir))
const outras = computed(() => lista.value.filter((e) => !e.posso_decidir))
const link = (e: any) => rotaProjeto(pid.value, 'etapas/' + e.id)
const ehAprovador = computed(() => projeto.value?.meus_papeis.includes('aprovador') || projeto.value?.pode.admin_projeto)
</script>
<template>
  <div>
    <div class="page-head"><div><h1>Painel de aprovações</h1><div class="sub">Testes concluídos aguardando análise. Quem executou o teste não pode aprová-lo.</div></div></div>
    <div v-if="!ehAprovador" class="alert info mb">Você não é aprovador neste projeto: a lista abaixo é apenas para acompanhamento.</div>
    <LoadingBox v-if="carregando" />
    <template v-else>
      <div v-if="ehAprovador" class="card pad-0 mb">
        <div class="card-head" style="padding:16px 18px 0"><h2><ShieldCheck :size="18" /> Aguardando sua decisão <span class="badge neutral">{{ minhas.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Nº</th><th>Etapa</th><th>Módulo</th><th class="num">Tent.</th><th>Testador</th><th>Resultado</th><th>Aguardando há</th><th /></tr></thead>
            <tbody>
              <tr v-for="e in minhas" :key="e.id" class="clickable" @click="navigateTo(link(e))">
                <td class="muted">#{{ e.codigo }}</td>
                <td class="strong">{{ e.nome }}</td>
                <td class="small muted">{{ e.modulo ?? '—' }}</td>
                <td class="num">{{ e.tentativa_atual }}</td>
                <td>{{ e.ultimo_teste?.testador ?? '—' }}</td>
                <td><span class="badge" :class="e.ultimo_teste?.resultado === 'sucesso' ? 'ok' : 'bad'">{{ RESULTADO[e.ultimo_teste?.resultado] ?? '—' }}</span></td>
                <td class="small muted nowrap">{{ relativo(e.status_desde) }}</td>
                <td class="num"><span class="btn sm">Analisar <ArrowRight :size="14" /></span></td>
              </tr>
              <tr v-if="!minhas.length"><td colspan="8"><EmptyState texto="Nenhum teste aguardando a sua aprovação." /></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="outras.length || !ehAprovador" class="card pad-0">
        <div class="card-head" style="padding:16px 18px 0"><h2>{{ ehAprovador ? 'Outras aguardando aprovação' : 'Aguardando aprovação' }} <span class="badge neutral">{{ outras.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Nº</th><th>Etapa</th><th>Testador</th><th>Aguardando há</th><th>Situação</th></tr></thead>
            <tbody>
              <tr v-for="e in outras" :key="e.id" class="clickable" @click="navigateTo(link(e))">
                <td class="muted">#{{ e.codigo }}</td><td>{{ e.nome }}</td>
                <td>{{ e.ultimo_teste?.testador ?? '—' }}</td>
                <td class="small muted nowrap">{{ relativo(e.status_desde) }}</td>
                <td class="small muted">{{ e.motivo_bloqueio ?? (ehAprovador ? 'Você não é aprovador desta etapa' : 'Aguardando aprovador') }}</td>
              </tr>
              <tr v-if="!outras.length"><td colspan="5"><EmptyState texto="Nenhum teste aguardando aprovação." /></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
