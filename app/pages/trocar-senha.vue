<script setup lang="ts">
import { KeyRound, ShieldAlert } from 'lucide-vue-next'
definePageMeta({ layout: 'auth' })
const me = useMe()
const f = reactive({ senha_atual: '', nova_senha: '', confirma: '' })
const carregando = ref(false)
const erro = ref('')
async function salvar() {
  erro.value = ''
  if (f.nova_senha !== f.confirma) { erro.value = 'A confirmação não confere com a nova senha.'; return }
  carregando.value = true
  try {
    await api('/me/senha', { method: 'POST', body: { senha_atual: f.senha_atual, nova_senha: f.nova_senha } })
    await loadMe()
    toast('Senha alterada com sucesso.')
    await navigateTo('/')
  } catch (e: any) { erro.value = e.message } finally { carregando.value = false }
}
</script>
<template>
  <div class="box card">
    <img src="/img/logo-slogan-azul.png" alt="NOVALE" class="logo" />
    <h1>Crie sua senha</h1>
    <div class="alert warn mt-s mb"><ShieldAlert :size="18" /><span>Olá, <b>{{ me?.usuario.nome }}</b>. Por segurança, troque a senha provisória antes de continuar.</span></div>
    <form @submit.prevent="salvar">
      <div class="field"><label class="req">Senha provisória (atual)</label><input v-model="f.senha_atual" class="input" type="password" autocomplete="current-password" /></div>
      <div class="field"><label class="req">Nova senha</label><input v-model="f.nova_senha" class="input" type="password" autocomplete="new-password" /><span class="hint">Mínimo de 8 caracteres, com letras e números.</span></div>
      <div class="field"><label class="req">Confirme a nova senha</label><input v-model="f.confirma" class="input" type="password" autocomplete="new-password" /></div>
      <div v-if="erro" class="alert danger mb">{{ erro }}</div>
      <button class="btn block" :disabled="carregando"><KeyRound :size="17" /> Salvar nova senha</button>
      <button type="button" class="btn ghost block mt-s" @click="logout">Sair</button>
    </form>
  </div>
</template>
<style scoped>
.box { width: 100%; max-width: 420px; padding: 32px; }
.logo { width: 200px; margin-bottom: 18px; }
.btn.block { height: 44px; }
</style>
