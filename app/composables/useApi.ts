/** Chamada à API (Edge Function) com o token do usuário logado. */
export class ApiError extends Error {
  status: number
  constructor(status: number, msg: string) { super(msg); this.status = status }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any; query?: Record<string, any> } = {}): Promise<T> {
  const cfg = useRuntimeConfig().public
  const sb = useSupabase()
  const { data } = await sb.auth.getSession()
  const token = data.session?.access_token
  if (!token) {
    await navigateTo('/login')
    throw new ApiError(401, 'Sessão expirada. Entre novamente.')
  }
  let url = (cfg.apiUrl as string) + path
  if (opts.query) {
    const qs = new URLSearchParams()
    Object.entries(opts.query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)) })
    const s = qs.toString()
    if (s) url += '?' + s
  }
  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.')
  }
  let payload: any = null
  try { payload = await res.json() } catch { /* sem corpo */ }
  if (res.status === 401) {
    await sb.auth.signOut()
    useState('me').value = null
    await navigateTo('/login')
    throw new ApiError(401, payload?.erro ?? 'Sessão expirada.')
  }
  if (res.status === 428) {
    await navigateTo('/trocar-senha')
    throw new ApiError(428, payload?.erro ?? 'Troque a sua senha.')
  }
  if (!res.ok) throw new ApiError(res.status, payload?.erro ?? `Erro ${res.status}`)
  return payload as T
}
