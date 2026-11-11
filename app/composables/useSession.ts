export type Me = {
  usuario: { id: string; nome: string; email: string; is_admin: boolean; must_change_password: boolean; ativo: boolean; created_at: string }
  papeis: string[]
  projetos: { id: string; nome: string; icone_url: string | null; status: string; papeis: string[] }[]
  notificacoes_nao_lidas: number
}

export function useMe() {
  return useState<Me | null>('me', () => null)
}

export async function loadMe(): Promise<Me | null> {
  const me = useMe()
  try {
    me.value = await api<Me>('/me')
  } catch (e: any) {
    if (e?.status === 401) me.value = null
    else throw e
  }
  return me.value
}

export async function logout() {
  limparCache()
  await useSupabase().auth.signOut()
  useMe().value = null
  await navigateTo('/login')
}
