<script setup lang="ts">
defineProps<{ criterios: any[] }>()
</script>
<template>
  <div class="table-wrap">
    <table class="tbl">
      <thead><tr><th style="width:40px">#</th><th>Critério</th><th style="width:100px">Resultado</th><th>Observação</th></tr></thead>
      <tbody>
        <tr v-for="(c, i) in criterios" :key="c.id">
          <td class="muted">{{ i + 1 }}</td>
          <td class="pre">{{ c.criterio_texto }}</td>
          <td><span class="badge" :class="c.resultado === 'ok' ? 'ok' : c.resultado === 'falhou' ? 'bad' : 'neutral'">{{ CRITERIO[c.resultado] ?? '—' }}</span></td>
          <td class="small pre">{{ c.observacao || '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
