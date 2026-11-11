<script setup lang="ts">
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Send } from 'lucide-vue-next'
const props = defineProps<{
  open: boolean; projetoId: string; etapa?: any | null; criteriosAtuais?: any[]; responsaveisAtuais?: any[]
  modulos: any[]; membros: any[]; somenteResponsaveis?: boolean; podeDisponibilizar?: boolean; moduloPadrao?: string | null
}>()
const emit = defineEmits<{ close: []; salvo: [id: string] }>()
const f = reactive<any>({ nome: '', descricao: '', module_id: '', criterios: [] as { id?: string; texto: string }[], testadores: [] as string[], aprovadores: [] as string[], disponibilizar: false })
const salvando = ref(false)
const novoCrit = ref('')

const testadoresProj = computed(() => props.membros.filter((m) => m.papel === 'testador'))
const aprovadoresProj = computed(() => props.membros.filter((m) => m.papel === 'aprovador'))

watch(() => props.open, (o) => {
  if (!o) return
  const e = props.etapa
  Object.assign(f, {
    nome: e?.nome ?? '', descricao: e?.descricao ?? '', module_id: e?.module_id ?? props.moduloPadrao ?? '',
    criterios: (props.criteriosAtuais ?? []).map((c) => ({ id: c.id, texto: c.texto })),
    testadores: (props.responsaveisAtuais ?? []).filter((r) => r.papel === 'testador').map((r) => r.user_id),
    aprovadores: (props.responsaveisAtuais ?? []).filter((r) => r.papel === 'aprovador').map((r) => r.user_id),
    disponibilizar: false,
  })
  novoCrit.value = ''
})

function addCrit() {
  const linhas = novoCrit.value.split('\n').map((s) => s.trim()).filter(Boolean)
  linhas.forEach((t) => f.criterios.push({ texto: t }))
  novoCrit.value = ''
}
function mover(i: number, d: number) {
  const j = i + d
  if (j < 0 || j >= f.criterios.length) return
  const [x] = f.criterios.splice(i, 1); f.criterios.splice(j, 0, x)
}
function toggle(lista: string[], id: string) { const i = lista.indexOf(id); i >= 0 ? lista.splice(i, 1) : lista.push(id) }

async function salvar() {
  if (novoCrit.value.trim()) addCrit()
  salvando.value = true
  try {
    if (props.somenteResponsaveis) {
      await api('/etapas/' + props.etapa.id, { method: 'PATCH', body: { testadores: f.testadores, aprovadores: f.aprovadores } })
      toast('Responsáveis atualizados.')
      return emit('salvo', props.etapa.id)
    }
    const body = { nome: f.nome, descricao: f.descricao, module_id: f.module_id || null, criterios: f.criterios.filter((c: any) => c.texto.trim()), testadores: f.testadores, aprovadores: f.aprovadores }
    if (props.etapa) {
      await api('/etapas/' + props.etapa.id, { method: 'PATCH', body })
      toast('Etapa atualizada.')
      emit('salvo', props.etapa.id)
    } else {
      const r = await api<any>('/etapas', { method: 'POST', body: { ...body, project_id: props.projetoId, disponibilizar: f.disponibilizar } })
      toast(f.disponibilizar ? 'Etapa criada e disponibilizada para teste.' : 'Etapa criada em elaboração.')
      emit('salvo', r.id)
    }
  } catch (e) { toastErro(e) } finally { salvando.value = false }
}
</script>
<template>
  <AppModal :open="open" :titulo="somenteResponsaveis ? 'Responsáveis da etapa' : etapa ? 'Editar etapa' : 'Nova etapa'" largura="760px" @close="emit('close')">
    <template v-if="!somenteResponsaveis">
      <div class="grid k2" style="gap:12px; grid-template-columns: 2fr 1fr">
        <div class="field"><label class="req">Nome da etapa</label><input v-model="f.nome" class="input" maxlength="200" /></div>
        <div class="field"><label>Módulo</label>
          <select v-model="f.module_id" class="select"><option value="">— Sem módulo —</option><option v-for="m in modulos" :key="m.id" :value="m.id">{{ m.nome }}</option></select>
        </div>
      </div>
      <div class="field"><label>Descrição detalhada / instruções de teste</label><textarea v-model="f.descricao" class="textarea" rows="4" placeholder="O que deve ser testado, ambiente, usuário de teste, passos…" /></div>

      <div class="label mb-s req">Critérios de aprovação</div>
      <div class="crits">
        <div v-for="(c, i) in f.criterios" :key="i" class="crit">
          <span class="n">{{ i + 1 }}</span>
          <textarea v-model="c.texto" class="textarea" rows="1" />
          <div class="row" style="gap:2px">
            <button class="btn ghost sm icon" title="Subir" @click="mover(i, -1)"><ArrowUp :size="14" /></button>
            <button class="btn ghost sm icon" title="Descer" @click="mover(i, 1)"><ArrowDown :size="14" /></button>
            <button class="btn ghost sm icon" title="Remover" @click="f.criterios.splice(i, 1)"><Trash2 :size="14" /></button>
          </div>
        </div>
        <div class="row top mt-s">
          <textarea v-model="novoCrit" class="textarea grow" rows="2" placeholder="Novo critério (cole vários, um por linha)" @keydown.enter.ctrl.prevent="addCrit" />
          <button class="btn secondary" @click="addCrit"><Plus :size="16" /> Adicionar</button>
        </div>
        <div class="small muted mt-s">Os resultados de testes já realizados guardam o texto original de cada critério.</div>
      </div>
    </template>

    <div class="grid k2 mt">
      <div>
        <div class="label mb-s">Testadores desta etapa</div>
        <div class="small muted mb-s">Nenhum marcado = todos os testadores do projeto.</div>
        <EmptyState v-if="!testadoresProj.length" texto="O projeto não tem testadores." />
        <label v-for="m in testadoresProj" :key="m.user_id" class="check pick"><input type="checkbox" :checked="f.testadores.includes(m.user_id)" @change="toggle(f.testadores, m.user_id)" /> {{ m.nome }}</label>
      </div>
      <div>
        <div class="label mb-s">Aprovadores desta etapa</div>
        <div class="small muted mb-s">Nenhum marcado = todos os aprovadores do projeto.</div>
        <EmptyState v-if="!aprovadoresProj.length" texto="O projeto não tem aprovadores." />
        <label v-for="m in aprovadoresProj" :key="m.user_id" class="check pick"><input type="checkbox" :checked="f.aprovadores.includes(m.user_id)" @change="toggle(f.aprovadores, m.user_id)" /> {{ m.nome }}</label>
      </div>
    </div>

    <label v-if="!etapa && podeDisponibilizar" class="check mt"><input v-model="f.disponibilizar" type="checkbox" /> Disponibilizar para teste imediatamente</label>

    <template #footer>
      <button class="btn secondary" @click="emit('close')">Cancelar</button>
      <button class="btn" :disabled="salvando || (!somenteResponsaveis && !f.nome)" @click="salvar">
        <Send v-if="f.disponibilizar" :size="16" /><Save v-else :size="16" /> {{ f.disponibilizar ? 'Salvar e disponibilizar' : 'Salvar' }}
      </button>
    </template>
  </AppModal>
</template>
<style scoped>
.crits { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: var(--row); }
.crit { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; }
.crit .n { width: 26px; height: 26px; border-radius: 50%; background: var(--navy); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 6px; }
.crit .textarea { min-height: 38px; padding: 8px 10px; }
.pick { display: flex; padding: 6px 0; }
</style>
