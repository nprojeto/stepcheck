<script setup lang="ts">
import { Save, Info } from 'lucide-vue-next'
const projeto = useProjeto()
const d = computed(() => projeto.value!)
const pid = computed(() => d.value.projeto.id)
const usuarios = ref<any[]>([])
const equipe = ref<Record<string, string[]>>({})
const salvando = ref(false)
const PAPEIS = ['administrador', 'disponibilizador', 'testador', 'aprovador']

function montar() {
  const m: Record<string, string[]> = {}
  for (const x of d.value.membros) (m[x.user_id] ??= []).push(x.papel)
  equipe.value = m
}
onMounted(async () => {
  montar()
  if (d.value.pode.administrar) {
    try { usuarios.value = await api('/usuarios') } catch (e) { toastErro(e) }
  }
})
const tem = (u: string, p: string) => equipe.value[u]?.includes(p)
function alterna(u: string, p: string) {
  const l = (equipe.value[u] ??= [])
  const i = l.indexOf(p); i >= 0 ? l.splice(i, 1) : l.push(p)
}
async function salvar() {
  salvando.value = true
  try {
    const membros = Object.entries(equipe.value).flatMap(([user_id, ps]) => ps.map((papel) => ({ user_id, papel })))
    await api(`/projetos/${pid.value}/membros`, { method: 'PUT', body: { membros } })
    toast('Equipe salva.')
    await carregarProjeto(pid.value); montar(); loadMe()
  } catch (e) { toastErro(e) } finally { salvando.value = false }
}
const membrosPorPapel = (p: string) => d.value.membros.filter((m: any) => m.papel === p)
const contagem = (p: string) => Object.values(equipe.value).filter((l) => l.includes(p)).length
const DESC: Record<string, string> = {
  administrador: 'Pode tudo no projeto: incluir, testar e aprovar etapas (inclusive o próprio teste), reabrir e excluir etapas.',
  disponibilizador: 'Cria etapas, descreve critérios, anexa documentos, disponibiliza para teste e faz as correções.',
  testador: 'Puxa as etapas disponíveis, executa os testes, registra resultados e evidências.',
  aprovador: 'Analisa os testes e aprova ou reprova, com justificativa obrigatória na reprovação.',
}
</script>

<template>
  <div>
    <div class="page-head"><div><h1>Equipe do projeto</h1><div class="sub">Quem disponibiliza, quem testa e quem aprova neste projeto.</div></div></div>
    <div class="grid k4 mb">
      <div v-for="p in PAPEIS" :key="p" class="card">
        <div class="row between"><RoleBadge :papel="p" /><b class="cnt">{{ contagem(p) }}</b></div>
        <p class="small muted mt-s">{{ DESC[p] }}</p>
        <template v-if="!d.pode.administrar">
          <EmptyState v-if="!membrosPorPapel(p).length" texto="Ninguém definido." />
          <div v-for="m in membrosPorPapel(p)" :key="m.user_id" class="pessoa"><b class="strong">{{ m.nome }}</b><div class="small muted">{{ m.email }}</div></div>
        </template>
      </div>
    </div>
    <template v-if="d.pode.administrar">
      <div class="alert info mb"><Info :size="17" /><span>Marque o papel de cada pessoa. Uma pessoa pode ter mais de um papel. Quem testa uma tentativa não pode aprová-la, exceto o administrador do projeto. Novos usuários são cadastrados em <NuxtLink to="/usuarios">Usuários</NuxtLink>.</span></div>
      <div class="card pad-0">
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Usuário</th><th>E-mail</th><th v-for="p in PAPEIS" :key="p" style="text-align:center">{{ PAPEL[p] }}</th></tr></thead>
            <tbody>
              <tr v-for="u in usuarios.filter((x) => x.ativo || equipe[x.id]?.length)" :key="u.id">
                <td class="strong">{{ u.nome }} <span v-if="!u.ativo" class="badge bad">inativo</span></td>
                <td class="muted">{{ u.email }}</td>
                <td v-for="p in PAPEIS" :key="p" style="text-align:center"><input type="checkbox" class="cb" :checked="tem(u.id, p)" @change="alterna(u.id, p)" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="row end mt"><button class="btn" :disabled="salvando" @click="salvar"><Save :size="16" /> Salvar equipe</button></div>
    </template>
  </div>
</template>

<style scoped>
.cnt { font-family: var(--font-title); font-size: 22px; color: var(--navy); }
.cb { width: 18px; height: 18px; accent-color: var(--brand); cursor: pointer; }
.pessoa { padding: 8px 0; border-top: 1px solid var(--border); }
</style>
