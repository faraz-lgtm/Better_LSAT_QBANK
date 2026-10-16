import { assertEquals } from 'jsr:@std/assert@1'
import { sendMetaCompleteRegistration } from './meta-capi.ts'

Deno.test('sendMetaCompleteRegistration no-ops when secrets missing', async () => {
  let called = false
  const ok = await sendMetaCompleteRegistration({
    email: 'a@b.com',
    userId: 'u-1',
    eventId: 'signup:u-1',
    getEnv: () => undefined,
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('sendMetaCompleteRegistration posts hashed email and event_id', async () => {
  let url = ''
  let body: Record<string, unknown> = {}
  const ok = await sendMetaCompleteRegistration({
    email: 'Test@Example.com',
    userId: 'u-1',
    eventId: 'signup:u-1',
    attribution: { fbp: 'fb.1.123', fbc: 'fb.1.456' },
    eventSourceUrl: 'https://app.betterlsat.com/auth/callback',
    getEnv: (key) => {
      if (key === 'META_PIXEL_ID') return '343480578585479'
      if (key === 'META_CAPI_ACCESS_TOKEN') return 'test-token'
      return undefined
    },
    fetchImpl: async (input, init) => {
      url = String(input)
      const rawBody = (init as { body?: string } | undefined)?.body ?? '{}'
      body = JSON.parse(rawBody) as Record<string, unknown>
      return new Response('{"events_received":1}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(url.includes('343480578585479/events'), true)
  assertEquals(url.includes('access_token=test-token'), true)
  const data = body.data as Record<string, unknown>[]
  assertEquals(data[0].event_name, 'CompleteRegistration')
  assertEquals(data[0].event_id, 'signup:u-1')
  const userData = data[0].user_data as Record<string, unknown>
  assertEquals(userData.external_id, 'u-1')
  assertEquals(userData.fbp, 'fb.1.123')
  assertEquals(userData.fbc, 'fb.1.456')
  const em = userData.em as string[]
  assertEquals(typeof em[0], 'string')
  assertEquals(em[0].length, 64)
})
