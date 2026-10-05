import { assertEquals } from 'jsr:@std/assert@1'
import { capturePostHogEvent } from './posthog.ts'

Deno.test('capturePostHogEvent no-ops when token missing', async () => {
  let called = false
  const ok = await capturePostHogEvent({
    distinctId: 'u-1',
    event: 'subscription_completed',
    getEnv: () => undefined,
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('capturePostHogEvent posts capture payload', async () => {
  let url = ''
  let body: Record<string, unknown> = {}
  const ok = await capturePostHogEvent({
    distinctId: 'u-1',
    event: 'subscription_completed',
    properties: { plan: 'monthly' },
    getEnv: (key) => {
      if (key === 'POSTHOG_PROJECT_TOKEN') return 'phc_test'
      if (key === 'POSTHOG_HOST') return 'https://e.bettermcat.com'
      return undefined
    },
    fetchImpl: async (input, init) => {
      url = String(input)
      const rawBody = (init as { body?: string } | undefined)?.body ?? '{}'
      body = JSON.parse(rawBody) as Record<string, unknown>
      return new Response('1', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(url, 'https://e.bettermcat.com/capture/')
  assertEquals(body.api_key, 'phc_test')
  assertEquals(body.event, 'subscription_completed')
  assertEquals(body.distinct_id, 'u-1')
  assertEquals((body.properties as Record<string, unknown>).plan, 'monthly')
})
