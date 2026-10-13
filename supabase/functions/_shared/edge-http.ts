import { createClient, type User } from 'npm:@supabase/supabase-js@2'

import { verifyAccessTokenLocally } from './verify-access-token.ts'

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

function userFromJwtClaims(claims: Record<string, unknown>): User | null {
  const sub = typeof claims.sub === 'string' ? claims.sub : ''
  if (!sub) return null
  return {
    id: sub,
    aud: typeof claims.aud === 'string' ? claims.aud : 'authenticated',
    role: typeof claims.role === 'string' ? claims.role : undefined,
    email: typeof claims.email === 'string' ? claims.email : undefined,
    app_metadata: (claims.app_metadata as Record<string, unknown>) ?? {},
    user_metadata: (claims.user_metadata as Record<string, unknown>) ?? {},
    created_at: '',
  } as User
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
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return { ok: false, response: json({ error: 'Unauthorized' }, { status: 401 }, cors) }
  }

  // HS256 projects: verify with JWT secret (no network).
  const hs256User = await verifyAccessTokenLocally(token)
  if (hs256User) return { ok: true, user: hs256User }

  const userClient = createClient(env.url, env.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  // ES256/asymmetric projects: getClaims verifies via cached JWKS (much faster than getUser).
  try {
    const { data, error } = await userClient.auth.getClaims(token)
    const claims = data?.claims as Record<string, unknown> | undefined
    const claimsUser = !error && claims ? userFromJwtClaims(claims) : null
    if (claimsUser) return { ok: true, user: claimsUser }
  } catch {
    // Fall through to getUser.
  }

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser(token)
  if (userErr || !user) {
    return { ok: false, response: json({ error: 'Unauthorized' }, { status: 401 }, cors) }
  }
  return { ok: true, user }
}
