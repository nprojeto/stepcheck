<script setup lang="ts">
import { LogIn, Mail, Lock, Eye, EyeOff, Info } from 'lucide-vue-next'
definePageMeta({ layout: 'auth' })
const email = ref('')
const senha = ref('')
const ver = ref(false)
const carregando = ref(false)
const erro = ref('')
const esqueci = ref(false)

async function entrar() {
  erro.value = ''
  if (!email.value || !senha.value) { erro.value = 'Informe e-mail e senha.'; return }
  carregando.value = true
  try {
    const { error } = await useSupabase().auth.signInWithPassword({ email: email.value.trim().toLowerCase(), password: senha.value })
    if (error) {
      erro.value = /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.'
        : /banned/i.test(error.message) ? 'Usuário inativo. Procure o administrador.' : error.message
      return
    }
    const me = await loadMe()
    if (!me) { erro.value = 'Não foi possível carregar o seu cadastro.'; return }
    await navigateTo(me.usuario.must_change_password ? '/trocar-senha' : '/')
  } catch (e: any) {
    erro.value = e?.message ?? 'Falha ao entrar.'
  } finally { carregando.value = false }
}
</script>
<template>
  <div class="box card">
    <img src="/img/logo-slogan-azul.png" alt="NOVALE" class="logo" />
    <h1>Acessar o StepCheck</h1>
    <p class="muted">Entre com o e-mail e a senha fornecidos pelo administrador.</p>
    <form class="mt" @submit.prevent="entrar">
      <div class="field">
        <label for="email">E-mail</label>
        <div class="ii"><Mail :size="17" /><input id="email" v-model="email" class="input" type="email" autocomplete="username" placeholder="nome@empresa.com.br" /></div>
      </div>
      <div class="field">
        <label for="senha">Senha</label>
        <div class="ii">
          <Lock :size="17" />
          <input id="senha" v-model="senha" class="input" :type="ver ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" />
          <button type="button" class="olho" :aria-label="ver ? 'Ocultar' : 'Mostrar'" @click="ver = !ver"><EyeOff v-if="ver" :size="17" /><Eye v-else :size="17" /></button>
        </div>
      </div>
      <div v-if="erro" class="alert danger mb">{{ erro }}</div>
      <button class="btn block" :disabled="carregando" type="submit">
        <span v-if="carregando" class="spinner" style="width:16px;height:16px;border-top-color:#fff" />
        <LogIn v-else :size="17" /> Entrar
      </button>
      <button type="button" class="btn ghost block mt-s" @click="esqueci = !esqueci">Esqueci minha senha</button>
      <div v-if="esqueci" class="alert info mt-s"><Info :size="17" /><span>Peça ao administrador do StepCheck para redefinir sua senha. Você receberá uma senha provisória e deverá trocá-la no primeiro acesso.</span></div>
    </form>
  </div>
</template>
<style scoped>
.box { width: 100%; max-width: 420px; padding: 32px; }
.logo { width: 230px; margin-bottom: 22px; }
h1 { font-size: 21px; margin-bottom: 4px; }
.ii { position: relative; }
.ii > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
.ii .input { padding-left: 38px; padding-right: 40px; height: 44px; }
.olho { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); border: 0; background: none; color: var(--muted); cursor: pointer; padding: 4px; }
.btn.block { height: 44px; }
</style>
