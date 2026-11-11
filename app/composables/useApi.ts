/** Chamada à API (Edge Function) com o token do usuário logado.
 *  Respostas de leitura (GET) ficam em memória: as telas mostram na hora o último
 *  resultado conhecido e atualizam em seguida. Qualquer gravação limpa a memória. */
const cache = new Map<string, any>()
function montarUrl(path: string, query?: Record<string, any>) {
  let url = path
  if (query) {
    const qs = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)) })
    const s = qs.toString()
    if (s) url += '?' + s
  }
  return url
}
/** Último resultado conhecido de uma leitura (ou undefined). */
export function apiCache<T = any>(path: string, query?: Record<string, any>): T | undefined {
  return cache.get(montarUrl(path, query))
}
export function limparCache() { cache.clear() }
/** Pré-carrega uma leitura em segundo plano (erros ignorados). */
export function preCarregar(path: string, query?: Record<string, any>) {
  if (!cache.has(montarUrl(path, query))) api(path, { query }).catch(() => {})
}
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
  const metodo = opts.method ?? 'GET'
  const chave = montarUrl(path, opts.query)
  const url = (cfg.apiUrl as string) + chave
  let res: Response
  try {
    res = await fetch(url, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.')
  }
  let payload: any = null
  try { payload = await res.json() } catch { /* sem corpo */ }
  if (res.status === 401) {
    cache.clear()
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
  if (metodo === 'GET') cache.set(chave, payload)
  else cache.clear()
  return payload as T
}
