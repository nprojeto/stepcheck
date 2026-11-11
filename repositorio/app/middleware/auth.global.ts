export default defineNuxtRouteMiddleware(async (to) => {
  const publica = to.path === '/login'
  const sb = useSupabase()
  const { data } = await sb.auth.getSession()
  if (!data.session) return publica ? undefined : navigateTo('/login')

  const me = useMe()
  if (!me.value) {
    try { await loadMe() } catch { /* sem conexão */ }
  }
  if (!me.value) return publica ? undefined : navigateTo('/login')
  if (me.value.usuario.must_change_password) {
    return to.path === '/trocar-senha' ? undefined : navigateTo('/trocar-senha')
  }
  if (publica || to.path === '/trocar-senha') return navigateTo('/')
  if (to.meta.admin && !me.value.usuario.is_admin) return navigateTo('/')
})
