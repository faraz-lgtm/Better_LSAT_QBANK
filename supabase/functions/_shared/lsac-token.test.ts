import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { fetchLawHubAccessToken } from './lsac-token.ts'

Deno.test('fetchLawHubAccessToken posts client_credentials form body', async () => {
  const requests: string[] = []
  const fetchImpl: typeof fetch = async (input, init) => {
    requests.push(input.toString())
    return new Response(
      JSON.stringify({ access_token: 'token-abc', expires_in: 3600 }),
      { status: 200 },
    )
  }

  const out = await fetchLawHubAccessToken(
    {
      LSAC_TENANT_ID: 'tenant-id',
      LSAC_CLIENT_ID: 'client-id',
      LSAC_CLIENT_SECRET: 'secret',
      LSAC_SCOPE: 'https://example/.default',
    },
    fetchImpl,
  )

  assertEquals(out.accessToken, 'token-abc')
  assertEquals(out.expiresInSeconds, 3600)
  assertEquals(
    requests[0],
    'https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token',
  )
})

Deno.test('fetchLawHubAccessToken accepts string expires_in', async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({ access_token: 't', expires_in: '3599' }),
      { status: 200 },
    )
  const out = await fetchLawHubAccessToken(
    {
      LSAC_TENANT_ID: 'tenant-id',
      LSAC_CLIENT_ID: 'client-id',
      LSAC_CLIENT_SECRET: 'secret',
      LSAC_SCOPE: 'https://example/.default',
    },
    fetchImpl,
  )
  assertEquals(out.expiresInSeconds, 3599)
})

Deno.test('fetchLawHubAccessToken throws when env incomplete', async () => {
  await assertRejects(
    () =>
      fetchLawHubAccessToken(
        { LSAC_TENANT_ID: 't' },
        globalThis.fetch,
      ),
    Error,
    'Missing LSAC OAuth env',
  )
})
