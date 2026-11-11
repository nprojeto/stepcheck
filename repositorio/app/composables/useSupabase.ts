import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Cliente Supabase (somente login/sessão e envio de anexos por link assinado). */
export function useSupabase(): SupabaseClient {
  if (!client) {
    const cfg = useRuntimeConfig().public
    client = createClient(cfg.supabaseUrl as string, cfg.supabaseKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'stepcheck-auth', detectSessionInUrl: false },
    })
  }
  return client
}
