<script setup lang="ts">
const props = defineProps<{ itens: any[]; mostrarProjeto?: boolean }>()
function detalhe(i: any) {
  const d = i.dados ?? {}
  if (d.motivo) return d.motivo
  if (d.nome) return d.nome
  if (d.arquivo) return d.arquivo
  if (d.incluidos || d.removidos) return `${d.incluidos?.length ?? 0} incluído(s), ${d.removidos?.length ?? 0} removido(s)`
  return ''
}
</script>
<template>
  <div class="table-wrap">
    <table class="tbl">
      <thead><tr><th>Data/hora</th><th>Usuário</th><th v-if="mostrarProjeto">Projeto</th><th>Ação</th><th>Item</th><th>Detalhe</th></tr></thead>
      <tbody>
        <tr v-for="i in itens" :key="i.id">
          <td class="nowrap">{{ dataHora(i.em) }}</td>
          <td class="nowrap">{{ i.usuario_nome ?? '—' }}</td>
          <td v-if="mostrarProjeto">{{ i.projeto_nome ?? '—' }}</td>
          <td class="nowrap">
            <StatusBadge v-if="i.acao.startsWith('status:')" :status="i.acao.split('>')[1]" curto />
            <span v-else>{{ acaoAuditoria(i.acao) }}</span>
          </td>
          <td>
            <NuxtLink v-if="i.etapa" :to="rotaProjeto(i.project_id, 'etapas/' + i.etapa.id)">#{{ i.etapa.codigo }} {{ i.etapa.nome }}</NuxtLink>
            <span v-else class="muted">{{ i.entidade }}</span>
          </td>
          <td class="small">{{ detalhe(i) }}</td>
        </tr>
        <tr v-if="!itens.length"><td :colspan="mostrarProjeto ? 6 : 5" class="empty">Nenhuma atividade registrada.</td></tr>
      </tbody>
    </table>
  </div>
</template>
