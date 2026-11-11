<script setup lang="ts">
import { Paperclip, Upload, FileText, Image as ImageIcon, Download } from 'lucide-vue-next'
const props = defineProps<{ anexos: any[]; stepId?: string; contexto?: string; podeEnviar?: boolean; compacto?: boolean }>()
const emit = defineEmits<{ enviado: [] }>()
const enviando = ref(false)
const progresso = ref('')

async function enviar(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length || !props.stepId) return
  enviando.value = true
  try {
    for (const [i, file] of files.entries()) {
      progresso.value = files.length > 1 ? `${i + 1}/${files.length}` : ''
      if (file.size > 50 * 1024 * 1024) { toast(`"${file.name}" passa de 50 MB.`, 'erro'); continue }
      const meta = { step_id: props.stepId, contexto: props.contexto ?? 'etapa', nome_arquivo: file.name, tamanho: file.size, mime_type: file.type || 'application/octet-stream' }
      const u = await api<any>('/anexos/upload-url', { method: 'POST', body: meta })
      const { error } = await useSupabase().storage.from('anexos').uploadToSignedUrl(u.path, u.token, file, { contentType: meta.mime_type })
      if (error) throw new Error('Falha no envio de "' + file.name + '": ' + error.message)
      await api('/anexos', { method: 'POST', body: { ...meta, path: u.path } })
    }
    toast(files.length > 1 ? 'Arquivos anexados.' : 'Arquivo anexado.')
    emit('enviado')
  } catch (e) { toastErro(e) } finally { enviando.value = false; progresso.value = '' }
}

async function abrir(a: any) {
  const w = window.open('', '_blank')
  try {
    const r = await api<any>(`/anexos/${a.id}/url`)
    if (w) w.location.href = r.url; else window.location.href = r.url
  } catch (e) { w?.close(); toastErro(e) }
}
const ehImagem = (a: any) => (a.mime_type ?? '').startsWith('image/')
</script>
<template>
  <div>
    <div v-if="!anexos.length && !podeEnviar" class="small muted">Nenhum anexo.</div>
    <div v-for="a in anexos" :key="a.id" class="anexo" @click="abrir(a)">
      <ImageIcon v-if="ehImagem(a)" :size="18" /><FileText v-else :size="18" />
      <div class="grow" style="min-width:0">
        <div class="ellipsis strong">{{ a.nome_arquivo }}</div>
        <div v-if="!compacto" class="small muted">{{ a.enviado_por_nome }} · {{ dataHora(a.enviado_em) }} <span v-if="a.tamanho">· {{ tamanho(a.tamanho) }}</span></div>
      </div>
      <Download :size="15" class="muted" />
    </div>
    <label v-if="podeEnviar" class="btn secondary sm mt-s" :class="{ disabled: enviando }">
      <span v-if="enviando" class="spinner" style="width:14px;height:14px" /><Upload v-else :size="14" />
      {{ enviando ? 'Enviando ' + progresso + '…' : 'Anexar arquivos' }}
      <input type="file" multiple hidden :disabled="enviando" @change="enviar" />
    </label>
  </div>
</template>
<style scoped>
.anexo { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 9px; margin-bottom: 6px; cursor: pointer; background: #fff; color: var(--brand); }
.anexo:hover { background: var(--soft); }
.anexo .strong { font-size: 13px; }
label.disabled { pointer-events: none; opacity: .7; }
</style>
