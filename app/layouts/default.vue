<script setup lang="ts">
import {
  LayoutDashboard, FolderKanban, ListChecks, FlaskConical, ShieldCheck, BarChart3, History,
  Users, UserCircle2, LogOut, Menu, Bell, X, ChevronDown, ArrowLeft, UsersRound,
} from 'lucide-vue-next'

const me = useMe()
const route = useRoute()
const aberto = ref(false)
const menuUser = ref(false)
const cfg = useRuntimeConfig().public

// Menu geral (fora de projeto)
const itensGerais = computed(() => {
  const l = [{ to: '/', label: 'Projetos', icon: FolderKanban }]
  if (me.value?.usuario.is_admin) l.push({ to: '/usuarios', label: 'Usuários', icon: Users })
  return l
})
// Menu do projeto aberto
const projeto = useProjeto()
const pid = computed(() => (route.params.id as string) || null)
const itensProjeto = computed(() => {
  if (!pid.value) return []
  const papeis: string[] = projeto.value?.projeto.id === pid.value ? projeto.value.meus_papeis : []
  const adm = !!me.value?.usuario.is_admin
  const b = '/projetos/' + pid.value
  const l = [
    { to: b, label: 'Visão geral', icon: LayoutDashboard, exato: true },
    { to: b + '/etapas', label: 'Etapas', icon: ListChecks },
  ]
  if (adm || papeis.includes('testador') || papeis.includes('disponibilizador')) l.push({ to: b + '/testes', label: 'Painel de testes', icon: FlaskConical })
  if (adm || papeis.includes('aprovador') || papeis.includes('disponibilizador')) l.push({ to: b + '/aprovacoes', label: 'Painel de aprovações', icon: ShieldCheck })
  l.push(
    { to: b + '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { to: b + '/historico', label: 'Histórico de atividades', icon: History },
    { to: b + '/equipe', label: 'Equipe', icon: UsersRound },
  )
  return l
})
const ativo = (to: string, exato = false) => (exato || to === '/' ? route.path === to : route.path.startsWith(to))
watch(() => route.fullPath, () => { aberto.value = false; menuUser.value = false })

const iniciais = computed(() => (me.value?.usuario.nome ?? '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase())

// Notificações
const notif = ref<any[]>([])
const notifAberto = ref(false)
const naoLidas = computed(() => me.value?.notificacoes_nao_lidas ?? 0)
async function abrirNotif() {
  notifAberto.value = !notifAberto.value
  if (notifAberto.value) {
    try { notif.value = await api('/notificacoes') } catch (e) { toastErro(e) }
  }
}
async function marcarTodas() {
  try {
    await api('/notificacoes/lidas', { method: 'POST', body: {} })
    notif.value = notif.value.map((n) => ({ ...n, lida: true }))
    if (me.value) me.value.notificacoes_nao_lidas = 0
  } catch (e) { toastErro(e) }
}
async function abrirItem(n: any) {
  notifAberto.value = false
  if (!n.lida) {
    api('/notificacoes/lidas', { method: 'POST', body: { ids: [n.id] } }).catch(() => {})
    if (me.value && me.value.notificacoes_nao_lidas > 0) me.value.notificacoes_nao_lidas--
  }
  if (n.step_id && n.project_id) navigateTo(rotaProjeto(n.project_id, 'etapas/' + n.step_id))
  else if (n.project_id) navigateTo(rotaProjeto(n.project_id))
}
let timer: any
onMounted(() => { timer = setInterval(() => loadMe().catch(() => {}), 60000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="shell">
    <aside class="sidebar" :class="{ aberto }">
      <div class="brand">
        <img src="/img/logo-branco.png" alt="NOVALE" class="logo" />
        <div class="produto">Step<b>Check</b></div>
        <button class="fechar btn ghost icon sm" @click="aberto = false"><X :size="18" /></button>
      </div>
      <nav>
        <template v-if="pid">
          <NuxtLink to="/" class="voltar"><ArrowLeft :size="15" /> Todos os projetos</NuxtLink>
          <div class="proj">
            <ProjectIcon :src="projeto?.projeto.id === pid ? projeto.projeto.icone_url : null" />
            <div class="grow" style="min-width:0">
              <div class="pnome">{{ projeto?.projeto.id === pid ? projeto.projeto.nome : 'Carregando…' }}</div>
              <div class="ppapel">{{ me?.usuario.is_admin ? 'Administrador' : (projeto?.meus_papeis ?? []).map((p: string) => PAPEL[p]).join(' · ') }}</div>
            </div>
          </div>
          <NuxtLink v-for="i in itensProjeto" :key="i.to" :to="i.to" class="nav" :class="{ on: ativo(i.to, i.exato) }">
            <component :is="i.icon" :size="18" /> <span>{{ i.label }}</span>
          </NuxtLink>
          <div class="sep" />
        </template>
        <NuxtLink v-for="i in itensGerais" v-show="!pid || i.to !== '/'" :key="i.to" :to="i.to" class="nav" :class="{ on: ativo(i.to) }">
          <component :is="i.icon" :size="18" /> <span>{{ i.label }}</span>
        </NuxtLink>
      </nav>
      <div class="rodape">
        <img src="/img/simbolo-branco.png" alt="" />
        <span>Transformando ideias em soluções inteligentes.</span>
        <small>v{{ cfg.versao }}</small>
      </div>
    </aside>
    <div v-if="aberto" class="backdrop" @click="aberto = false" />

    <div class="main-wrap">
      <header class="topbar">
        <button class="btn ghost icon hamb" aria-label="Menu" @click="aberto = true"><Menu :size="20" /></button>
        <div class="grow" />
        <div class="pop-wrap">
          <button class="btn ghost icon bell" aria-label="Notificações" @click="abrirNotif">
            <Bell :size="20" />
            <span v-if="naoLidas" class="pill">{{ naoLidas > 99 ? '99+' : naoLidas }}</span>
          </button>
          <div v-if="notifAberto" class="pop notif">
            <div class="row between pop-head">
              <strong>Notificações</strong>
              <button class="btn ghost sm" @click="marcarTodas">Marcar todas como lidas</button>
            </div>
            <div class="lista">
              <EmptyState v-if="!notif.length" texto="Nenhuma notificação." />
              <button v-for="n in notif" :key="n.id" class="nitem" :class="{ nova: !n.lida }" @click="abrirItem(n)">
                <div class="strong">{{ n.titulo }}</div>
                <div class="small">{{ n.mensagem }}</div>
                <div class="small muted">{{ n.projects?.nome }} · {{ relativo(n.criada_em) }}</div>
              </button>
            </div>
          </div>
          <div v-if="notifAberto" class="click-out" @click="notifAberto = false" />
        </div>
        <div class="pop-wrap">
          <button class="user" @click="menuUser = !menuUser">
            <span class="avatar">{{ iniciais }}</span>
            <span class="uinfo">
              <span class="nome">{{ me?.usuario.nome }}</span>
              <span class="papel">{{ me?.usuario.is_admin ? 'Administrador' : (me?.papeis.map((p) => PAPEL[p]).join(' · ') || 'Usuário') }}</span>
            </span>
            <ChevronDown :size="16" />
          </button>
          <div v-if="menuUser" class="pop menu">
            <NuxtLink to="/perfil" class="mi"><UserCircle2 :size="16" /> Meu perfil</NuxtLink>
            <button class="mi" @click="logout"><LogOut :size="16" /> Sair</button>
          </div>
          <div v-if="menuUser" class="click-out" @click="menuUser = false" />
        </div>
      </header>
      <main class="main"><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; }
.sidebar {
  position: fixed; inset: 0 auto 0 0; width: var(--sidebar-w); background: linear-gradient(180deg, var(--navy) 0%, #0A2350 100%);
  color: #fff; display: flex; flex-direction: column; z-index: 50; transition: transform .25s;
}
.brand { padding: 20px 18px 14px; border-bottom: 1px solid rgba(255,255,255,.1); position: relative; }
.logo { width: 150px; display: block; }
.produto { margin-top: 10px; font-family: var(--font-title); font-weight: 600; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #B9C6E6; }
.produto b { color: #fff; font-weight: 800; }
.fechar { display: none; position: absolute; right: 10px; top: 14px; color: #fff !important; }
nav { padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; flex: 1; overflow-y: auto; }
.nav { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 9px; color: #C9D3EA; font-weight: 500; font-size: 13.5px; text-decoration: none !important; transition: .15s; }
.nav:hover { background: rgba(255,255,255,.07); color: #fff; }
.nav.on { background: #fff; color: var(--navy); font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
.nav.on svg { color: var(--brand); }
.voltar { display: flex; align-items: center; gap: 7px; padding: 6px 12px; color: #9FB0D6; font-size: 12.5px; font-weight: 600; text-decoration: none !important; border-radius: 8px; }
.voltar:hover { color: #fff; background: rgba(255,255,255,.07); }
.proj { display: flex; align-items: center; gap: 10px; margin: 6px 4px 10px; padding: 10px; border-radius: 10px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); }
.proj .pico { border: 0; }
.pnome { font-family: var(--font-title); font-weight: 700; font-size: 14px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ppapel { font-size: 11px; color: #9FB0D6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sep { height: 1px; background: rgba(255,255,255,.1); margin: 10px 4px; }
.rodape { padding: 14px 18px; border-top: 1px solid rgba(255,255,255,.1); display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #8FA0C8; }
.rodape img { width: 30px; opacity: .8; }
.main-wrap { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; }
.topbar { position: sticky; top: 0; z-index: 40; height: 62px; background: rgba(255,255,255,.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; padding: 0 20px; }
.hamb { display: none; }
.main { padding: 24px; max-width: 1440px; width: 100%; margin: 0 auto; }
.bell { position: relative; }
.pill { position: absolute; top: 3px; right: 1px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; border-radius: 99px; padding: 0 5px; line-height: 16px; min-width: 16px; }
.user { display: flex; align-items: center; gap: 10px; border: 0; background: transparent; cursor: pointer; padding: 5px 8px; border-radius: 10px; color: var(--navy); }
.user:hover { background: var(--soft); }
.avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--brand); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; font-family: var(--font-title); }
.uinfo { display: flex; flex-direction: column; text-align: left; line-height: 1.25; }
.uinfo .nome { font-weight: 700; font-size: 13px; }
.uinfo .papel { font-size: 11.5px; color: var(--muted); }
.pop-wrap { position: relative; }
.pop { position: absolute; right: 0; top: calc(100% + 8px); background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow-lg); z-index: 60; }
.click-out { position: fixed; inset: 0; z-index: 55; }
.menu { width: 200px; padding: 6px; }
.mi { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 10px; border: 0; background: none; border-radius: 8px; font: 500 13.5px var(--font); color: var(--text-strong); cursor: pointer; text-decoration: none !important; }
.mi:hover { background: var(--soft); }
.notif { width: 360px; max-width: calc(100vw - 24px); }
.pop-head { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--navy); }
.lista { max-height: 420px; overflow-y: auto; }
.nitem { display: block; width: 100%; text-align: left; border: 0; background: #fff; padding: 10px 14px; border-bottom: 1px solid var(--border); cursor: pointer; font-family: var(--font); color: var(--text); }
.nitem:hover { background: var(--row); }
.nitem.nova { background: #F1F5FF; border-left: 3px solid var(--brand); }
.backdrop { display: none; }
@media (max-width: 960px) {
  .sidebar { transform: translateX(-100%); box-shadow: var(--shadow-lg); }
  .sidebar.aberto { transform: none; }
  .fechar { display: inline-flex; }
  .backdrop { display: block; position: fixed; inset: 0; background: rgba(13,43,94,.4); z-index: 45; }
  .main-wrap { margin-left: 0; }
  .hamb { display: inline-flex; }
  .main { padding: 16px; }
  .uinfo { display: none; }
}
</style>
