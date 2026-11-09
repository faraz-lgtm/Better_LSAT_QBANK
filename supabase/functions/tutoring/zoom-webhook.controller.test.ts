import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { zoomWebhookValidationHash } from './zoom-webhook.controller.ts'

Deno.test('Zoom endpoint validation uses HMAC-SHA256 of the plain token with the webhook secret', async () => {
  const hash = await zoomWebhookValidationHash(
    'The quick brown fox jumps over the lazy dog',
    'key',
  )

  assertEquals(
    hash,
    'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
  )
})
