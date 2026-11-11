<script setup lang="ts">
import { Save, KeyRound, UserCircle2 } from 'lucide-vue-next'
const me = useMe()
const nome = ref(me.value?.usuario.nome ?? '')
const s = reactive({ senha_atual: '', nova_senha: '', confirma: '' })
const salvando = ref(false)
async function salvarNome() {
  salvando.value = true
  try { await api('/me', { method: 'PATCH', body: { nome: nome.value } }); await loadMe(); toast('Perfil atualizado.') }
  catch (e) { toastErro(e) } finally { salvando.value = false }
}
async function trocar() {
  if (s.nova_senha !== s.confirma) return toast('A confirmação não confere com a nova senha.', 'erro')
  salvando.value = true
  try {
    await api('/me/senha', { method: 'POST', body: { senha_atual: s.senha_atual, nova_senha: s.nova_senha } })
    Object.assign(s, { senha_atual: '', nova_senha: '', confirma: '' })
    toast('Senha alterada com sucesso.')
  } catch (e) { toastErro(e) } finally { salvando.value = false }
}
</script>
<template>
  <div>
    <div class="page-head"><div><h1>Meu perfil</h1><div class="sub">Seus dados de acesso e participação em projetos.</div></div></div>
    <div class="grid k2">
      <div class="card">
        <div class="section-title"><UserCircle2 :size="16" /> Dados pessoais</div>
        <div class="kv mb">
          <div class="k">E-mail</div><div class="v">{{ me?.usuario.email }}</div>
          <div class="k">Perfil</div><div class="v">{{ me?.usuario.is_admin ? 'Administrador' : 'Usuário' }}</div>
          <div class="k">Cadastro</div><div class="v">{{ data(me?.usuario.created_at) }}</div>
        </div>
        <div class="field"><label>Nome completo</label><input v-model="nome" class="input" /></div>
        <button class="btn" :disabled="salvando" @click="salvarNome"><Save :size="16" /> Salvar</button>
      </div>
      <div class="card">
        <div class="section-title"><KeyRound :size="16" /> Alterar senha</div>
        <div class="field"><label>Senha atual</label><input v-model="s.senha_atual" type="password" class="input" autocomplete="current-password" /></div>
        <div class="field"><label>Nova senha</label><input v-model="s.nova_senha" type="password" class="input" autocomplete="new-password" /><span class="hint">Mínimo de 8 caracteres, com letras e números.</span></div>
        <div class="field"><label>Confirme a nova senha</label><input v-model="s.confirma" type="password" class="input" autocomplete="new-password" /></div>
        <button class="btn" :disabled="salvando" @click="trocar"><KeyRound :size="16" /> Alterar senha</button>
      </div>
    </div>
    <div class="card mt">
      <div class="section-title">Meus projetos</div>
      <EmptyState v-if="!me?.projetos.length" texto="Você ainda não participa de nenhum projeto." />
      <div v-for="p in me?.projetos" :key="p.id" class="row wrap prj">
        <ProjectIcon :src="p.icone_url" size="sm" />
        <NuxtLink :to="'/projetos/' + p.id" class="strong grow">{{ p.nome }}</NuxtLink>
        <RoleBadge v-for="r in p.papeis" :key="r" :papel="r" />
      </div>
    </div>
  </div>
</template>
<style scoped>.prj { padding: 10px 0; border-bottom: 1px solid var(--border); } .prj:last-child { border: 0; }</style>
