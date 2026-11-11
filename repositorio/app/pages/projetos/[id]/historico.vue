<script setup lang="ts">
import { Download, ChevronLeft, ChevronRight } from 'lucide-vue-next'
const projeto = useProjeto()
const pid = computed(() => projeto.value!.projeto.id)
const f = reactive({ de: '', ate: '' })
const r = ref<any>({ total: 0, itens: [] })
const pagina = ref(0)
const tam = 50
const carregando = ref(true)
async function carregar() {
  carregando.value = true
  try { r.value = await api('/historico', { query: { project_id: pid.value, de: f.de, ate: f.ate, limit: tam, offset: pagina.value * tam } }) }
  catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)
watch(() => [f.de, f.ate], () => { pagina.value = 0; carregar() })
watch(pagina, carregar)
const paginas = computed(() => Math.max(1, Math.ceil(r.value.total / tam)))
async function exportar() {
  try {
    const todos = await api<any>('/historico', { query: { project_id: pid.value, de: f.de, ate: f.ate, limit: 500 } })
    baixarCsv(`historico-${projeto.value.projeto.nome}.csv`, [['Data/hora', 'Usuário', 'Ação', 'Item', 'Detalhe'],
      ...todos.itens.map((i: any) => [dataHora(i.em), i.usuario_nome, acaoAuditoria(i.acao), i.etapa ? `#${i.etapa.codigo} ${i.etapa.nome}` : i.entidade, i.dados?.motivo ?? i.dados?.nome ?? i.dados?.arquivo ?? ''])])
  } catch (e) { toastErro(e) }
}
</script>
<template>
  <div>
    <div class="page-head">
      <div><h1>Histórico de atividades</h1><div class="sub">Registro de auditoria de todas as ações deste projeto. Os registros não podem ser alterados nem excluídos.</div></div>
      <button class="btn secondary" @click="exportar"><Download :size="16" /> Exportar CSV</button>
    </div>
    <div class="toolbar">
      <label class="row small" style="gap:6px">De <input v-model="f.de" type="date" class="input" style="min-width:0" /></label>
      <label class="row small" style="gap:6px">Até <input v-model="f.ate" type="date" class="input" style="min-width:0" /></label>
    </div>
    <LoadingBox v-if="carregando" />
    <div v-else class="card pad-0"><ActivityList :itens="r.itens" /></div>
    <div class="row between mt">
      <span class="small muted">{{ r.total }} registro(s)</span>
      <div class="row">
        <button class="btn secondary sm icon" :disabled="pagina === 0" @click="pagina--"><ChevronLeft :size="16" /></button>
        <span class="small">Página {{ pagina + 1 }} de {{ paginas }}</span>
        <button class="btn secondary sm icon" :disabled="pagina + 1 >= paginas" @click="pagina++"><ChevronRight :size="16" /></button>
      </div>
    </div>
  </div>
</template>
