import { assertEquals } from 'jsr:@std/assert@1'
import { formatUnknownError } from './format-error.ts'

Deno.test('formatUnknownError reads PostgREST-style objects', () => {
  const message = formatUnknownError({
    code: 'PGRST204',
    message: "Could not find the 'stripe_customer_id' column of 'profiles'",
    details: null,
    hint: null,
  })
  assertEquals(message.includes('stripe_customer_id'), true)
})

Deno.test('formatUnknownError reads Error.message', () => {
  assertEquals(formatUnknownError(new Error('Stripe is down')), 'Stripe is down')
})
