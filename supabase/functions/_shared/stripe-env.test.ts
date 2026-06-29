import { assertEquals } from 'jsr:@std/assert@1'
import {
  isLocalSupabaseHost,
  parseStripeEnv,
  resolvePlanFromPriceId,
  resolveStripeLiveMode,
} from './stripe-env.ts'

const testCredentials = {
  STRIPE_SECRET_KEY_TEST: 'sk_test_x',
  STRIPE_WEBHOOK_SECRET_TEST: 'whsec_test',
  STRIPE_PRICE_ID_CORE_TEST: 'price_core_test',
  STRIPE_PRICE_ID_LIVE_MONTHLY_TEST: 'price_live_test',
  STRIPE_PRICE_ID_LSAC_YEARLY_TEST: 'price_lsac_test',
  STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test_x',
  STRIPE_SECRET_KEY_LIVE: 'sk_live_x',
  STRIPE_WEBHOOK_SECRET_LIVE: 'whsec_live',
  STRIPE_PRICE_ID_CORE_LIVE: 'price_core_live',
  STRIPE_PRICE_ID_LIVE_MONTHLY_LIVE: 'price_live_live',
  STRIPE_PRICE_ID_LSAC_YEARLY_LIVE: 'price_lsac_live',
  STRIPE_PUBLISHABLE_KEY_LIVE: 'pk_live_x',
}

Deno.test('isLocalSupabaseHost detects local URLs', () => {
  assertEquals(isLocalSupabaseHost('http://127.0.0.1:54321'), true)
  assertEquals(isLocalSupabaseHost('http://localhost:54321'), true)
  assertEquals(isLocalSupabaseHost('https://abc.supabase.co'), false)
})

Deno.test('resolveStripeLiveMode forces test on localhost', () => {
  assertEquals(
    resolveStripeLiveMode({
      SUPABASE_URL: 'http://127.0.0.1:54321',
      STRIPE_LIVE_MODE: 'true',
    }),
    false,
  )
})

Deno.test('resolveStripeLiveMode respects STRIPE_LIVE_MODE on hosted', () => {
  assertEquals(
    resolveStripeLiveMode({
      SUPABASE_URL: 'https://abc.supabase.co',
      STRIPE_LIVE_MODE: 'true',
    }),
    true,
  )
  assertEquals(
    resolveStripeLiveMode({
      SUPABASE_URL: 'https://abc.supabase.co',
    }),
    false,
  )
})

Deno.test('parseStripeEnv returns test keys when live mode is false', () => {
  const env = parseStripeEnv({
    ...testCredentials,
    SUPABASE_URL: 'https://abc.supabase.co',
  })
  assertEquals(env?.liveMode, false)
  assertEquals(env?.secretKey, 'sk_test_x')
  assertEquals(env?.priceIds.core, 'price_core_test')
  assertEquals(env?.priceIds.live, 'price_live_test')
  assertEquals(env?.priceIds.lsacYearly, 'price_lsac_test')
  assertEquals(env?.publishableKey, 'pk_test_x')
})

Deno.test('parseStripeEnv returns live keys when STRIPE_LIVE_MODE=true on hosted', () => {
  const env = parseStripeEnv({
    ...testCredentials,
    SUPABASE_URL: 'https://abc.supabase.co',
    STRIPE_LIVE_MODE: 'true',
  })
  assertEquals(env?.liveMode, true)
  assertEquals(env?.secretKey, 'sk_live_x')
  assertEquals(env?.priceIds.core, 'price_core_live')
})

Deno.test('parseStripeEnv falls back to legacy STRIPE_PRICE_ID_TEST for core', () => {
  const env = parseStripeEnv({
    STRIPE_SECRET_KEY_TEST: 'sk_test_x',
    STRIPE_WEBHOOK_SECRET_TEST: 'whsec_test',
    STRIPE_PRICE_ID_TEST: 'price_legacy',
    STRIPE_PRICE_ID_LIVE_MONTHLY_TEST: 'price_live_test',
    STRIPE_PRICE_ID_LSAC_YEARLY_TEST: 'price_lsac_test',
    STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test_x',
    SUPABASE_URL: 'https://abc.supabase.co',
  })
  assertEquals(env?.priceIds.core, 'price_legacy')
})

Deno.test('resolvePlanFromPriceId maps core and live prices', () => {
  const priceIds = {
    core: 'price_core',
    live: 'price_live',
    lsacYearly: 'price_lsac',
  }
  assertEquals(resolvePlanFromPriceId(priceIds, 'price_core'), 'core')
  assertEquals(resolvePlanFromPriceId(priceIds, 'price_live'), 'live')
  assertEquals(resolvePlanFromPriceId(priceIds, 'price_lsac'), null)
})

Deno.test('parseStripeEnv returns null when credentials missing', () => {
  assertEquals(parseStripeEnv({ SUPABASE_URL: 'https://abc.supabase.co' }), null)
})
