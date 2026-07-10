import { assertEquals } from 'jsr:@std/assert@1'
import { createBillingService } from './billing.service.ts'
import type { BillingRepository } from './billing.repository.ts'
import type { StripeRuntimeEnv } from '../_shared/stripe-env.ts'

const env: StripeRuntimeEnv = {
  secretKey: 'sk_test_x',
  webhookSecret: 'whsec_test',
  priceIds: {
    core: 'price_core_test',
    live: 'price_live_test',
    lsacYearly: 'price_lsac_test',
  },
  publishableKey: 'pk_test_x',
  liveMode: false,
}

function makeRepo(overrides: Partial<BillingRepository> = {}): BillingRepository {
  return {
    async getProfileBillingFields() {
      return {
        id: 'u-1',
        email: 'a@b.com',
        stripe_customer_id: null,
        prep_plus_source: null,
      }
    },
    async setStripeCustomerId() {},
    async setPrepPlusSource() {},
    async getLatestSubscriptionByUserId() {
      return null
    },
    async getProfileIdByStripeCustomerId() {
      return 'u-1'
    },
    async upsertSubscription() {},
    async hasActiveSubscription() {
      return false
    },
    async recordWebhookEventIfNew() {
      return true
    },
    ...overrides,
  }
}

Deno.test('billing service createCheckoutSession creates customer and returns url', async () => {
  let customerCreated = false
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async setStripeCustomerId(userId, customerId) {
        assertEquals(userId, 'u-1')
        assertEquals(customerId, 'cus_1')
      },
    }),
    stripe: {
      customers: {
        create: async () => {
          customerCreated = true
          return { id: 'cus_1' }
        },
      },
      prices: {
        retrieve: async (id: string) => {
          if (id === 'price_lsac_test') {
            return {
              id,
              type: 'recurring',
              recurring: { interval: 'year' },
              unit_amount: 9900,
              currency: 'usd',
              product: { name: 'LawHub Advantage' },
            }
          }
          return { id, type: 'recurring', recurring: { interval: 'month' } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            assertEquals(params.mode, 'subscription')
            const lineItems = params.line_items as Array<Record<string, unknown>>
            assertEquals(lineItems[0], { price: 'price_core_test', quantity: 1 })
            assertEquals((lineItems[1]?.price_data as Record<string, unknown>)?.unit_amount, 9900)
            assertEquals((params.metadata as Record<string, string>).plan, 'core')
            return { url: 'https://checkout.stripe.test/session' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'core')
  assertEquals(customerCreated, true)
  assertEquals(out.url, 'https://checkout.stripe.test/session')
})

Deno.test('billing service createCheckoutSession skips LawHub when includeLawHub is false', async () => {
  let sourceSet = false
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async setPrepPlusSource(userId, source) {
        sourceSet = true
        assertEquals(userId, 'u-1')
        assertEquals(source, 'existing_lsac')
      },
    }),
    stripe: {
      customers: {
        create: async () => ({ id: 'cus_1' }),
      },
      prices: {
        retrieve: async (id: string) => {
          if (id === 'price_core_test') {
            return {
              id,
              type: 'recurring',
              recurring: { interval: 'month' },
              unit_amount: 7000,
              currency: 'usd',
            }
          }
          return { id, type: 'recurring', recurring: { interval: 'month' } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            const lineItems = params.line_items as Array<Record<string, unknown>>
            assertEquals(lineItems.length, 1)
            const priceData = lineItems[0]?.price_data as Record<string, unknown>
            assertEquals(priceData?.unit_amount, 7000)
            assertEquals(
              (priceData?.product_data as Record<string, string>)?.name,
              'Better LSAT Core',
            )
            assertEquals((params.metadata as Record<string, string>).include_lawhub, 'false')
            assertEquals(
              (params.custom_text as Record<string, Record<string, string>>)?.submit?.message,
              'Better LSAT membership only. You keep your existing LawHub PrepPlus through LSAC — no LawHub fee from Better LSAT.',
            )
            return { url: 'https://checkout.stripe.test/no-lsac' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'core', { includeLawHub: false })
  assertEquals(sourceSet, true)
  assertEquals(out.url, 'https://checkout.stripe.test/no-lsac')
})

Deno.test('billing service createCheckoutSession uses live plan price', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          stripe_customer_id: 'cus_existing',
          prep_plus_source: null,
        }
      },
    }),
    stripe: {
      prices: {
        retrieve: async (id: string) => {
          if (id === 'price_lsac_test') {
            return {
              id,
              type: 'recurring',
              recurring: { interval: 'year' },
              unit_amount: 9900,
              currency: 'usd',
              product: { name: 'LawHub Advantage' },
            }
          }
          return { id, type: 'recurring', recurring: { interval: 'month' } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            const lineItems = params.line_items as Array<{ price: string; quantity: number }>
            assertEquals(lineItems[0], { price: 'price_live_test', quantity: 1 })
            return { url: 'https://checkout.stripe.test/live' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'live')
  assertEquals(out.url, 'https://checkout.stripe.test/live')
})

Deno.test('billing service accepts one-time LawHub price', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo(),
    stripe: {
      customers: {
        create: async () => ({ id: 'cus_1' }),
      },
      prices: {
        retrieve: async (id: string) => {
          if (id === 'price_lsac_test') return { id, type: 'one_time' }
          return { id, type: 'recurring', recurring: { interval: 'month' } }
        },
      },
      checkout: {
        sessions: {
          create: async () => ({ url: 'https://checkout.stripe.test/lsac-onetime' }),
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'core')
  assertEquals(out.url, 'https://checkout.stripe.test/lsac-onetime')
})

Deno.test('billing service checkout.session.completed syncs subscription', async () => {
  let upserted = false
  let sourceSet = false
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async upsertSubscription(input) {
        upserted = true
        assertEquals(input.userId, 'u-1')
        assertEquals(input.stripeSubscriptionId, 'sub_1')
        assertEquals(input.status, 'active')
        assertEquals(input.planTier, 'core')
      },
      async setPrepPlusSource(userId, source) {
        sourceSet = true
        assertEquals(userId, 'u-1')
        assertEquals(source, 'vendor_subscription')
      },
    }),
    stripe: {
      subscriptions: {
        retrieve: async () => ({
          id: 'sub_1',
          status: 'active',
          livemode: false,
          cancel_at_period_end: false,
          current_period_start: 1_700_000_000,
          current_period_end: 1_700_086_400,
          customer: 'cus_1',
          items: { data: [{ price: { id: 'price_core_test' } }] },
        }),
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await service.handleWebhookEvent({
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        client_reference_id: 'u-1',
        customer: 'cus_1',
        subscription: 'sub_1',
        metadata: { plan: 'core' },
      },
    },
  } as unknown as import('npm:stripe@17.7.0').default.Event)

  assertEquals(upserted, true)
  assertEquals(sourceSet, true)
})

Deno.test('billing service skips duplicate webhook events', async () => {
  let upsertCalls = 0
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async recordWebhookEventIfNew() {
        return false
      },
      async upsertSubscription() {
        upsertCalls += 1
      },
    }),
    stripe: {} as unknown as import('npm:stripe@17.7.0').default,
  })

  await service.handleWebhookEvent({
    id: 'evt_dup',
    type: 'checkout.session.completed',
    data: { object: {} },
  } as unknown as import('npm:stripe@17.7.0').default.Event)

  assertEquals(upsertCalls, 0)
})
