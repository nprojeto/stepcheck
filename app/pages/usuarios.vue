<script setup lang="ts">
import { UserPlus, Search, Pencil, KeyRound, Save, RefreshCw, Copy, ShieldCheck } from 'lucide-vue-next'
definePageMeta({ admin: true })
const me = useMe()
const lista = ref<any[]>([])
const carregando = ref(true)
const busca = ref('')
const mostrarInativos = ref(false)
async function carregar() {
  try { lista.value = await api('/usuarios') } catch (e) { toastErro(e) } finally { carregando.value = false }
}
onMounted(carregar)
const filtrados = computed(() => lista.value.filter((u) => (mostrarInativos.value || u.ativo)
  && (!busca.value || (u.nome + ' ' + u.email).toLowerCase().includes(busca.value.toLowerCase()))))

const modal = ref<'' | 'novo' | 'editar' | 'senha'>('')
const f = reactive<any>({ id: '', nome: '', email: '', senha: '', is_admin: false, ativo: true })
const salvando = ref(false)
const senhaGerada = ref('')
function novo() { Object.assign(f, { id: '', nome: '', email: '', senha: senhaProvisoria(), is_admin: false, ativo: true }); senhaGerada.value = ''; modal.value = 'novo' }
function editar(u: any) { Object.assign(f, { id: u.id, nome: u.nome, email: u.email, is_admin: u.is_admin, ativo: u.ativo }); modal.value = 'editar' }
function senha(u: any) { Object.assign(f, { id: u.id, nome: u.nome, email: u.email, senha: senhaProvisoria() }); senhaGerada.value = ''; modal.value = 'senha' }
async function salvar() {
  salvando.value = true
  try {
    if (modal.value === 'novo') {
      await api('/usuarios', { method: 'POST', body: { nome: f.nome, email: f.email, senha: f.senha, is_admin: f.is_admin } })
      senhaGerada.value = f.senha
      toast('Usuário criado.')
    } else if (modal.value === 'editar') {
      await api('/usuarios/' + f.id, { method: 'PATCH', body: { nome: f.nome, is_admin: f.is_admin, ativo: f.ativo } })
      toast('Usuário atualizado.'); modal.value = ''
    } else {
      await api(`/usuarios/${f.id}/senha`, { method: 'POST', body: { senha: f.senha } })
      senhaGerada.value = f.senha
      toast('Senha redefinida.')
    }
    carregar()
  } catch (e) { toastErro(e) } finally { salvando.value = false }
}
const textoAcesso = computed(() => `Acesso ao StepCheck\nEndereço: https://nprojeto.github.io/stepcheck/\nE-mail: ${f.email}\nSenha provisória: ${senhaGerada.value}\n(troque a senha no primeiro acesso)`)
async function copiar() { try { await navigator.clipboard.writeText(textoAcesso.value); toast('Dados de acesso copiados.') } catch { toast('Não foi possível copiar.', 'erro') } }
</script>
<template>
  <div>
    <div class="page-head">
      <div><h1>Usuários</h1><div class="sub">Cadastre pessoas e defina administradores. Os papéis (disponibilizador, testador, aprovador) são definidos em cada projeto, na aba Equipe.</div></div>
      <button class="btn" @click="novo"><UserPlus :size="17" /> Novo usuário</button>
    </div>
    <div class="toolbar">
      <div class="search"><Search :size="16" /><input v-model="busca" class="input" placeholder="Buscar por nome ou e-mail…" /></div>
      <label class="check"><input v-model="mostrarInativos" type="checkbox" /> Mostrar inativos</label>
    </div>
    <LoadingBox v-if="carregando" />
    <div v-else class="card pad-0">
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Projetos e papéis</th><th>Situação</th><th>Cadastro</th><th /></tr></thead>
          <tbody>
            <tr v-for="u in filtrados" :key="u.id">
              <td class="strong">{{ u.nome }}</td>
              <td class="muted">{{ u.email }}</td>
              <td><span v-if="u.is_admin" class="badge neutral"><ShieldCheck :size="12" /> Admin</span><span v-else class="small muted">Usuário</span></td>
              <td class="small">
                <div v-for="p in u.projetos" :key="p.project_id + p.papel">{{ p.nome }} · <RoleBadge :papel="p.papel" /></div>
                <span v-if="!u.projetos.length" class="muted">—</span>
              </td>
              <td>
                <span class="badge" :class="u.ativo ? 'ok' : 'bad'">{{ u.ativo ? 'Ativo' : 'Inativo' }}</span>
                <span v-if="u.must_change_password" class="badge warn" style="margin-left:4px">Senha provisória</span>
              </td>
              <td class="small muted nowrap">{{ data(u.created_at) }}</td>
              <td class="num nowrap">
                <button class="btn ghost sm" @click="editar(u)"><Pencil :size="14" /> Editar</button>
                <button class="btn ghost sm" @click="senha(u)"><KeyRound :size="14" /> Senha</button>
              </td>
            </tr>
            <tr v-if="!filtrados.length"><td colspan="7" class="empty">Nenhum usuário.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal :open="!!modal" :titulo="modal === 'novo' ? 'Novo usuário' : modal === 'editar' ? 'Editar usuário' : 'Redefinir senha'" @close="modal = ''">
      <template v-if="senhaGerada">
        <div class="alert ok mb">Pronto! Envie os dados abaixo para {{ f.nome }}. A senha provisória deverá ser trocada no primeiro acesso.</div>
        <pre class="acesso">{{ textoAcesso }}</pre>
      </template>
      <template v-else>
        <template v-if="modal !== 'senha'">
          <div class="field"><label class="req">Nome completo</label><input v-model="f.nome" class="input" maxlength="120" /></div>
          <div class="field"><label class="req">E-mail</label><input v-model="f.email" class="input" type="email" :disabled="modal === 'editar'" /></div>
        </template>
        <p v-else class="muted">Defina uma senha provisória para <b>{{ f.nome }}</b> ({{ f.email }}). No próximo acesso, a pessoa será obrigada a trocá-la.</p>
        <div v-if="modal !== 'editar'" class="field">
          <label class="req">Senha provisória</label>
          <div class="row"><input v-model="f.senha" class="input" /><button class="btn secondary icon" title="Gerar outra" @click="f.senha = senhaProvisoria()"><RefreshCw :size="16" /></button></div>
          <span class="hint">Mínimo de 8 caracteres, com letras e números.</span>
        </div>
        <template v-if="modal !== 'senha'">
          <label class="check mb-s"><input v-model="f.is_admin" type="checkbox" :disabled="f.id === me?.usuario.id" /> Administrador (gerencia usuários, projetos e equipes)</label>
          <label v-if="modal === 'editar'" class="check"><input v-model="f.ativo" type="checkbox" :disabled="f.id === me?.usuario.id" /> Usuário ativo (desmarque para bloquear o acesso)</label>
        </template>
      </template>
      <template #footer>
        <template v-if="senhaGerada">
          <button class="btn secondary" @click="copiar"><Copy :size="16" /> Copiar dados de acesso</button>
          <button class="btn" @click="modal = ''">Concluir</button>
        </template>
        <template v-else>
          <button class="btn secondary" @click="modal = ''">Cancelar</button>
          <button class="btn" :disabled="salvando" @click="salvar"><Save :size="16" /> Salvar</button>
        </template>
      </template>
    </AppModal>
  </div>
</template>
<style scoped>.acesso { background: var(--row); border: 1px solid var(--border); border-radius: 10px; padding: 14px; font-size: 13px; white-space: pre-wrap; margin: 0; }</style>
