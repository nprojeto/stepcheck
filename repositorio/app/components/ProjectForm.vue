<script setup lang="ts">
import { Save, ImagePlus, Trash2 } from 'lucide-vue-next'
const props = defineProps<{ open: boolean; projeto?: any | null }>()
const emit = defineEmits<{ close: []; salvo: [id: string] }>()
const usuarios = ref<any[]>([])
const f = reactive<any>({ nome: '', descricao: '', status: 'em_andamento', responsavel_id: '', icone: null, preview: null, remover_icone: false })
const salvando = ref(false)

watch(() => props.open, async (o) => {
  if (!o) return
  const p = props.projeto
  Object.assign(f, {
    nome: p?.nome ?? '', descricao: p?.descricao ?? '', status: p?.status ?? 'em_andamento',
    responsavel_id: p?.responsavel_id ?? useMe().value?.usuario.id, icone: null, preview: p?.icone_url ?? null, remover_icone: false,
  })
  try { usuarios.value = (await api<any[]>('/usuarios')).filter((u) => u.ativo) } catch (e) { toastErro(e) }
})

async function escolherIcone(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) return toast('O ícone deve ter no máximo 2 MB.', 'erro')
  f.icone = await arquivoParaDataUrl(file)
  f.preview = f.icone
  f.remover_icone = false
}
function removerIcone() { f.icone = null; f.preview = null; f.remover_icone = true }

async function salvar() {
  salvando.value = true
  try {
    const body: any = { nome: f.nome, descricao: f.descricao, status: f.status, responsavel_id: f.responsavel_id || undefined }
    if (f.icone) body.icone = f.icone
    if (f.remover_icone) body.remover_icone = true
    if (props.projeto) {
      await api('/projetos/' + props.projeto.id, { method: 'PATCH', body })
      toast('Projeto atualizado.')
      emit('salvo', props.projeto.id)
    } else {
      const r = await api<any>('/projetos', { method: 'POST', body })
      toast('Projeto criado. Agora defina a equipe.')
      emit('salvo', r.id)
    }
  } catch (e) { toastErro(e) } finally { salvando.value = false }
}
</script>
<template>
  <AppModal :open="open" :titulo="projeto ? 'Editar projeto' : 'Novo projeto'" @close="emit('close')">
    <div class="row top">
      <div class="col" style="align-items:center">
        <ProjectIcon :src="f.preview" size="lg" />
        <label class="btn secondary sm"><ImagePlus :size="14" /> Ícone<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="escolherIcone" /></label>
        <button v-if="f.preview" class="btn ghost sm" @click="removerIcone"><Trash2 :size="14" /> Remover</button>
      </div>
      <div class="grow">
        <div class="field"><label class="req">Nome do projeto</label><input v-model="f.nome" class="input" maxlength="150" /></div>
        <div class="grid k2" style="gap:12px">
          <div class="field"><label>Responsável</label>
            <select v-model="f.responsavel_id" class="select"><option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option></select>
          </div>
          <div class="field"><label>Status</label>
            <select v-model="f.status" class="select"><option v-for="(l, k) in STATUS_PROJETO" :key="k" :value="k">{{ l }}</option></select>
          </div>
        </div>
      </div>
    </div>
    <div class="field"><label>Descrição</label><textarea v-model="f.descricao" class="textarea" rows="4" /></div>
    <template #footer>
      <button class="btn secondary" @click="emit('close')">Cancelar</button>
      <button class="btn" :disabled="salvando || !f.nome" @click="salvar"><Save :size="16" /> Salvar</button>
    </template>
  </AppModal>
</template>
