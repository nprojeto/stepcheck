<script setup lang="ts">
import { ShieldCheck, ArrowRight } from 'lucide-vue-next'
const lista = ref<any[]>([])
const carregando = ref(true)
onMounted(async () => {
  try { lista.value = await api('/painel/aprovacoes') } catch (e) { toastErro(e) } finally { carregando.value = false }
})
const minhas = computed(() => lista.value.filter((e) => e.posso_decidir))
const outras = computed(() => lista.value.filter((e) => !e.posso_decidir))
</script>
<template>
  <div>
    <div class="page-head"><div><h1>Painel de aprovações</h1><div class="sub">Testes concluídos aguardando análise. Quem executou o teste não pode aprová-lo.</div></div></div>
    <LoadingBox v-if="carregando" />
    <template v-else>
      <div class="card pad-0 mb">
        <div class="card-head" style="padding:16px 18px 0"><h2><ShieldCheck :size="18" /> Aguardando sua decisão <span class="badge neutral">{{ minhas.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Projeto</th><th>Nº</th><th>Etapa</th><th class="num">Tent.</th><th>Testador</th><th>Resultado</th><th>Aguardando há</th><th /></tr></thead>
            <tbody>
              <tr v-for="e in minhas" :key="e.id" class="clickable" @click="navigateTo('/etapas/' + e.id)">
                <td><div class="row" style="gap:8px"><ProjectIcon :src="e.projeto_icone" size="sm" /><span class="nowrap">{{ e.projeto_nome }}</span></div></td>
                <td class="muted">#{{ e.codigo }}</td>
                <td class="strong">{{ e.nome }}</td>
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
      <div v-if="outras.length" class="card pad-0">
        <div class="card-head" style="padding:16px 18px 0"><h2>Outras aguardando aprovação <span class="badge neutral">{{ outras.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Projeto</th><th>Nº</th><th>Etapa</th><th>Testador</th><th>Situação</th></tr></thead>
            <tbody>
              <tr v-for="e in outras" :key="e.id" class="clickable" @click="navigateTo('/etapas/' + e.id)">
                <td class="nowrap">{{ e.projeto_nome }}</td><td class="muted">#{{ e.codigo }}</td><td>{{ e.nome }}</td>
                <td>{{ e.ultimo_teste?.testador ?? '—' }}</td>
                <td class="small muted">{{ e.motivo_bloqueio ?? 'Você não é aprovador desta etapa' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
