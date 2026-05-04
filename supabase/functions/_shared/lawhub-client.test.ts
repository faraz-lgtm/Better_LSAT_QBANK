import { assertEquals } from 'jsr:@std/assert@1'
import { createLawHubClient, resetLawHubTokenCacheForTests } from './lawhub-client.ts'

const sampleEnv = {
  LSAC_BASE_URL: 'https://providers-api-sandbox.lawhub.org',
  LSAC_VENDOR_ID: 'vendor-uuid',
  LSAC_TENANT_ID: 'tenant-id',
  LSAC_CLIENT_ID: 'client-id',
  LSAC_CLIENT_SECRET: 'secret',
  LSAC_SCOPE: 'https://example/.default',
}

Deno.test('LawHub client fetches token then calls vendor GET with Bearer', async () => {
  resetLawHubTokenCacheForTests()
  const urls: string[] = []
  const fetchImpl: typeof fetch = async (input, init) => {
    urls.push(input.toString())
    const u = input.toString()
    const ri = init as RequestInit | undefined
    if (u.includes('login.microsoftonline.com')) {
      return new Response(
        JSON.stringify({ access_token: 'access-xyz', expires_in: 3600 }),
        { status: 200 },
      )
    }
    if (u.endsWith('/api/vendor/vendor-uuid/students') && ri?.method === 'GET') {
      const h = new Headers(ri.headers)
      assertEquals(h.get('Authorization'), 'Bearer access-xyz')
      return new Response(JSON.stringify([{ studentCoachingId: 's1' }]), {
        status: 200,
      })
    }
    return new Response(`unexpected: ${u}`, { status: 500 })
  }

  const client = createLawHubClient({
    getEnv: () => sampleEnv,
    fetchImpl,
  })

  const data = await client.listVendorStudents()
  assertEquals(data, [{ studentCoachingId: 's1' }])
  assertEquals(urls[0].includes('microsoftonline.com'), true)
  assertEquals(urls[1].includes('/api/vendor/vendor-uuid/students'), true)
})

Deno.test('LawHub client reuses token on second call', async () => {
  resetLawHubTokenCacheForTests()
  let tokenPosts = 0
  const fetchImpl: typeof fetch = async (input) => {
    const u = input.toString()
    if (u.includes('login.microsoftonline.com')) {
      tokenPosts++
      return new Response(
        JSON.stringify({ access_token: 'tok', expires_in: 3600 }),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify([]), { status: 200 })
  }
  const client = createLawHubClient({
    getEnv: () => sampleEnv,
    fetchImpl,
  })
  await client.listVendorStudents()
  await client.listVendorStudents()
  assertEquals(tokenPosts, 1)
})

Deno.test('LawHub client retries on transient 503', async () => {
  resetLawHubTokenCacheForTests()
  let apiCalls = 0
  const fetchImpl: typeof fetch = async (input) => {
    const u = input.toString()
    if (u.includes('login.microsoftonline.com')) {
      return new Response(
        JSON.stringify({ access_token: 'tok', expires_in: 3600 }),
        { status: 200 },
      )
    }
    apiCalls++
    if (apiCalls === 1) return new Response('busy', { status: 503 })
    return new Response(JSON.stringify([]), { status: 200 })
  }
  const client = createLawHubClient({ getEnv: () => sampleEnv, fetchImpl })
  const out = await client.listVendorStudents()
  assertEquals(Array.isArray(out), true)
  assertEquals(apiCalls, 2)
})

Deno.test('LawHub client clears token and retries once on 401', async () => {
  resetLawHubTokenCacheForTests()
  let tokenValue = 'tok-1'
  let tokenCalls = 0
  let apiCalls = 0
  const fetchImpl: typeof fetch = async (input, init) => {
    const u = input.toString()
    if (u.includes('login.microsoftonline.com')) {
      tokenCalls++
      tokenValue = tokenCalls === 1 ? 'tok-1' : 'tok-2'
      return new Response(
        JSON.stringify({ access_token: tokenValue, expires_in: 3600 }),
        { status: 200 },
      )
    }
    apiCalls++
    const requestInit = init as globalThis.RequestInit | undefined
    const auth = new Headers(requestInit?.headers).get('Authorization')
    if (apiCalls === 1 && auth === 'Bearer tok-1') {
      return new Response('expired', { status: 401 })
    }
    return new Response(JSON.stringify([]), { status: 200 })
  }
  const client = createLawHubClient({ getEnv: () => sampleEnv, fetchImpl })
  await client.listVendorStudents()
  assertEquals(tokenCalls, 2)
  assertEquals(apiCalls, 2)
})
