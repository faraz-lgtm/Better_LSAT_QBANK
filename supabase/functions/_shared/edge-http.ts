import { createClient, type User } from 'npm:@supabase/supabase-js@2'

/** CORS for typical browser + supabase-js invoke (narrow). */
export const CORS_EDGE_NARROW: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** CORS including methods and extra headers (analytics-style). */
export const CORS_EDGE_WIDE: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, prefer, x-upsert, x-supabase-client',
  'Access-Control-Max-Age': '86400',
}

export function json(
  data: unknown,
  init: ResponseInit = {},
  cors: Record<string, string> = CORS_EDGE_NARROW,
): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
      ...init.headers,
    },
  })
}

export function optionsOk(cors: Record<string, string> = CORS_EDGE_NARROW): Response {
  return new Response('ok', { headers: cors })
}

export function optionsNoContent(cors: Record<string, string> = CORS_EDGE_WIDE): Response {
  return new Response(null, { status: 204, headers: cors })
}

export function getSupabaseUrlAndAnonKey(): { url: string; anonKey: string } | null {
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export async function requireAuthUser(
  req: Request,
  cors: Record<string, string> = CORS_EDGE_NARROW,
): Promise<{ ok: true; user: User } | { ok: false; response: Response }> {
  const env = getSupabaseUrlAndAnonKey()
  if (!env) {
    return { ok: false, response: json({ error: 'Server misconfigured' }, { status: 500 }, cors) }
  }
  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(env.url, env.anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) {
    return { ok: false, response: json({ error: 'Unauthorized' }, { status: 401 }, cors) }
  }
  return { ok: true, user }
}
