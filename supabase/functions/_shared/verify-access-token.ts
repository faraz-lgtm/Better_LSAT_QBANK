import type { User } from 'npm:@supabase/supabase-js@2'

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!
  return diff === 0
}

/**
 * Verify a Supabase user access token locally with the project JWT secret (HS256).
 * Avoids an Auth API round-trip from auth.getUser().
 */
export async function verifyAccessTokenLocally(token: string): Promise<User | null> {
  const secret = Deno.env.get('SUPABASE_JWT_SECRET')
  if (!secret || !token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts
  if (!headerB64 || !payloadB64 || !signatureB64) return null

  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64))) as Record<
      string,
      unknown
    >
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64))) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }

  if (header.alg !== 'HS256') return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  const actual = base64UrlToBytes(signatureB64)
  if (!timingSafeEqual(expected, actual)) return null

  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp < now) return null
  if (typeof payload.nbf === 'number' && payload.nbf > now) return null

  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  if (!sub) return null

  return {
    id: sub,
    aud: typeof payload.aud === 'string' ? payload.aud : 'authenticated',
    role: typeof payload.role === 'string' ? payload.role : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    app_metadata: (payload.app_metadata as Record<string, unknown>) ?? {},
    user_metadata: (payload.user_metadata as Record<string, unknown>) ?? {},
    created_at: '',
  } as User
}
