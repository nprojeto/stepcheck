<script setup lang="ts">
import { FlaskConical, Play, Lock, ArrowRight, Search } from 'lucide-vue-next'
const projeto = useProjeto()
const pid = computed(() => projeto.value!.projeto.id)
const lista = ref<any[]>(apiCache('/painel/testes', { project_id: pid.value }) ?? [])
const carregando = ref(!apiCache('/painel/testes', { project_id: pid.value }))
const ocupado = ref('')
const busca = ref('')
const modulo = ref('')
async function carregar() {
  try { lista.value = await api<any[]>('/painel/testes', { query: { project_id: pid.value } }) }
  catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)
const filtra = (l: any[]) => l.filter((e) => (!busca.value || (e.nome + ' #' + e.codigo).toLowerCase().includes(busca.value.toLowerCase())) && (!modulo.value || e.modulo === modulo.value))
const comigo = computed(() => filtra(lista.value.filter((e) => e.comigo)))
const disponiveis = computed(() => filtra(lista.value.filter((e) => e.status === 'disponibilizado')))
const comOutros = computed(() => filtra(lista.value.filter((e) => e.status === 'em_execucao' && !e.comigo)))
const ehTestador = computed(() => projeto.value?.meus_papeis.includes('testador'))
const link = (e: any) => rotaProjeto(pid.value, 'etapas/' + e.id)
async function puxar(e: any) {
  ocupado.value = e.id
  try {
    await api(`/etapas/${e.id}/acao`, { method: 'POST', body: { acao: 'iniciar_teste' } })
    toast('Etapa reservada para você. Bom teste!')
    navigateTo(link(e))
  } catch (err) { toastErro(err); carregar() } finally { ocupado.value = '' }
}
</script>
<template>
  <div>
    <div class="page-head"><div><h1>Painel de testes</h1><div class="sub">Puxe uma etapa disponível para testar. Uma etapa já em teste com outra pessoa fica bloqueada.</div></div></div>
    <div v-if="!ehTestador" class="alert info mb">Você não é testador neste projeto: a lista abaixo é apenas para acompanhamento.</div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar etapa…" /></div>
      <select v-model="modulo" class="select"><option value="">Todos os módulos</option><option v-for="m in projeto?.modulos" :key="m.id" :value="m.nome">{{ m.nome }}</option></select>
    </div>
    <LoadingBox v-if="carregando" />
    <template v-else>
      <div v-if="comigo.length" class="card mb destaque">
        <div class="section-title" style="color:var(--st-exec)"><FlaskConical :size="16" /> Em teste com você ({{ comigo.length }})</div>
        <div class="grid k3">
          <NuxtLink v-for="e in comigo" :key="e.id" :to="link(e)" class="item card flat">
            <div class="strong">#{{ e.codigo }} · {{ e.nome }}</div>
            <div class="small muted">{{ e.modulo }}</div>
            <div class="row between mt-s"><span class="small muted">desde {{ relativo(e.status_desde) }}</span><span class="btn sm">Continuar <ArrowRight :size="14" /></span></div>
          </NuxtLink>
        </div>
      </div>

      <div class="card pad-0 mb">
        <div class="card-head" style="padding:16px 18px 0"><h2>Disponíveis para teste <span class="badge neutral">{{ disponiveis.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Nº</th><th>Etapa</th><th>Módulo</th><th class="num">Tentativa</th><th>Disponível desde</th><th /></tr></thead>
            <tbody>
              <tr v-for="e in disponiveis" :key="e.id">
                <td class="muted">#{{ e.codigo }}</td>
                <td><NuxtLink :to="link(e)" class="strong">{{ e.nome }}</NuxtLink><span v-if="e.tentativa_atual > 1" class="badge bad" style="margin-left:6px">retorno</span></td>
                <td class="small muted">{{ e.modulo ?? '—' }}</td>
                <td class="num">{{ e.tentativa_atual }}</td>
                <td class="small muted nowrap">{{ relativo(e.status_desde) }}</td>
                <td class="num"><button v-if="e.posso_puxar" class="btn sm" :disabled="ocupado === e.id" @click="puxar(e)"><Play :size="14" /> Puxar</button></td>
              </tr>
              <tr v-if="!disponiveis.length"><td colspan="6"><EmptyState texto="Nenhuma etapa disponível para teste no momento." /></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="comOutros.length" class="card pad-0">
        <div class="card-head" style="padding:16px 18px 0"><h2>Em teste com outras pessoas <span class="badge neutral">{{ comOutros.length }}</span></h2></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Nº</th><th>Etapa</th><th>Testador</th><th>Desde</th></tr></thead>
            <tbody>
              <tr v-for="e in comOutros" :key="e.id" class="clickable" @click="navigateTo(link(e))">
                <td class="muted">#{{ e.codigo }}</td><td>{{ e.nome }}</td>
                <td><span class="badge warn"><Lock :size="12" /> {{ e.testador_atual_nome }}</span></td>
                <td class="small muted">{{ relativo(e.status_desde) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
.destaque { border: 2px solid #F3C98B; background: #FFFBF4; }
.item { display: block; text-decoration: none !important; color: inherit; padding: 14px; }
.item:hover { border-color: var(--st-exec); }
</style>
