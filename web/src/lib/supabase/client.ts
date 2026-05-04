import { createClient } from '@supabase/supabase-js'

let browserClient: ReturnType<typeof createClient> | null = null

/** Single browser Supabase client; safe to call from client components after env is set. */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  browserClient = createClient(url, anonKey)
  return browserClient
}
