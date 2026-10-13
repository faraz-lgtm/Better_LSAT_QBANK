import { assertEquals } from 'jsr:@std/assert@1'

import { verifyAccessTokenLocally } from './verify-access-token.ts'

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function signHs256(secret: string, header: object, payload: object): Promise<string> {
  const headerB64 = b64url(JSON.stringify(header))
  const payloadB64 = b64url(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${headerB64}.${payloadB64}`)),
  )
  let bin = ''
  for (const byte of sig) bin += String.fromCharCode(byte)
  const sigB64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `${headerB64}.${payloadB64}.${sigB64}`
}

Deno.test('verifyAccessTokenLocally accepts a valid HS256 user token', async () => {
  Deno.env.set('SUPABASE_JWT_SECRET', 'test-secret-value-for-unit-tests')
  const token = await signHs256(
    'test-secret-value-for-unit-tests',
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: 'user-123',
      role: 'authenticated',
      email: 'a@b.co',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
  )
  const user = await verifyAccessTokenLocally(token)
  assertEquals(user?.id, 'user-123')
  assertEquals(user?.email, 'a@b.co')
})

Deno.test('verifyAccessTokenLocally rejects tampered tokens', async () => {
  Deno.env.set('SUPABASE_JWT_SECRET', 'test-secret-value-for-unit-tests')
  const token = await signHs256(
    'test-secret-value-for-unit-tests',
    { alg: 'HS256', typ: 'JWT' },
    { sub: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 },
  )
  const tampered = token.slice(0, -4) + 'xxxx'
  assertEquals(await verifyAccessTokenLocally(tampered), null)
})

Deno.test('verifyAccessTokenLocally rejects expired tokens', async () => {
  Deno.env.set('SUPABASE_JWT_SECRET', 'test-secret-value-for-unit-tests')
  const token = await signHs256(
    'test-secret-value-for-unit-tests',
    { alg: 'HS256', typ: 'JWT' },
    { sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 10 },
  )
  assertEquals(await verifyAccessTokenLocally(token), null)
})
