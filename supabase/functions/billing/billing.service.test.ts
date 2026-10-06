import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert@1'
import { createBillingService, parseCheckoutSuccessPath, type CheckoutCompletedContext } from './billing.service.ts'
import type { BillingRepository } from './billing.repository.ts'
import type { StripeRuntimeEnv } from '../_shared/stripe-env.ts'

const env: StripeRuntimeEnv = {
  secretKey: 'sk_test_x',
  webhookSecret: 'whsec_test',
  priceIds: {
    monthly: 'price_core_test',
    threeMonth: 'price_core_3_month_test',
    sixMonth: 'price_core_6_month_test',
    yearly: 'price_core_yearly_test',
    lsacYearly: 'price_lsac_test',
    live: 'price_live_test',
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
        full_name: 'Ada Lovelace',
        first_name: 'Ada',
        last_name: 'Lovelace',
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
            assertEquals(
              params.success_url,
              'http://localhost:5173/onboarding?checkout=success',
            )
            assertEquals(
              params.cancel_url,
              'http://localhost:5173/checkout?plan=monthly&checkout=cancel',
            )
            const lineItems = params.line_items as Array<Record<string, unknown>>
            assertEquals(lineItems[0], { price: 'price_core_test', quantity: 1 })
            assertEquals((lineItems[1]?.price_data as Record<string, unknown>)?.unit_amount, 9900)
            assertEquals((params.metadata as Record<string, string>).plan, 'monthly')
            return { url: 'https://checkout.stripe.test/session' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'monthly')
  assertEquals(customerCreated, true)
  assertEquals(out.url, 'https://checkout.stripe.test/session')
})

Deno.test('billing service createCheckoutSession accepts custom successPath', async () => {
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
            assertEquals(
              params.success_url,
              'http://localhost:5173/app/diagnostic/results?checkout=success',
            )
            return { url: 'https://checkout.stripe.test/diagnostic' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'monthly', {
    successPath: '/app/diagnostic/results?checkout=success',
  })
  assertEquals(out.url, 'https://checkout.stripe.test/diagnostic')
})

Deno.test('parseCheckoutSuccessPath rejects unsafe paths', () => {
  assertEquals(parseCheckoutSuccessPath(undefined), '/onboarding?checkout=success')
  assertThrows(() => parseCheckoutSuccessPath('https://evil.test/nope'))
  assertThrows(() => parseCheckoutSuccessPath('/app/../admin'))
  assertEquals(parseCheckoutSuccessPath('/app/diagnostic/results?checkout=success'), '/app/diagnostic/results?checkout=success')
  assertEquals(parseCheckoutSuccessPath('/app?checkout=success'), '/app?checkout=success')
  assertEquals(parseCheckoutSuccessPath('/onboarding?checkout=success'), '/onboarding?checkout=success')
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
              unit_amount: 6900,
              currency: 'usd',
            }
          }
          return { id, type: 'recurring', recurring: { interval: 'month', interval_count: 1 } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            const lineItems = params.line_items as Array<Record<string, unknown>>
            assertEquals(lineItems.length, 1)
            const priceData = lineItems[0]?.price_data as Record<string, unknown>
            assertEquals(priceData?.unit_amount, 6900)
            assertEquals(priceData?.recurring, { interval: 'month', interval_count: 1 })
            assertEquals(
              (priceData?.product_data as Record<string, string>)?.name,
              'Better LSAT Monthly',
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

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'monthly', { includeLawHub: false })
  assertEquals(sourceSet, true)
  assertEquals(out.url, 'https://checkout.stripe.test/no-lsac')
})

Deno.test('billing service createCheckoutSession uses the 3-month Core price', async () => {
  let customerNameUpdated: string | null = null
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          full_name: 'Ada Lovelace',
          first_name: 'Ada',
          last_name: 'Lovelace',
          stripe_customer_id: 'cus_existing',
          prep_plus_source: null,
        }
      },
    }),
    stripe: {
      customers: {
        update: async (customerId: string, params: Record<string, unknown>) => {
          assertEquals(customerId, 'cus_existing')
          customerNameUpdated = params.name as string
          return { id: customerId }
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
          if (id === 'price_core_3_month_test') {
            return { id, type: 'recurring', recurring: { interval: 'month', interval_count: 3 } }
          }
          return { id, type: 'recurring', recurring: { interval: 'month', interval_count: 1 } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            const lineItems = params.line_items as Array<{ price: string; quantity: number }>
            assertEquals(lineItems[0], { price: 'price_core_3_month_test', quantity: 1 })
            assertEquals((params.metadata as Record<string, string>).plan, 'three_month')
            assertEquals('customer_details' in params, false)
            return { url: 'https://checkout.stripe.test/three-month' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'three_month')
  assertEquals(customerNameUpdated, 'Ada Lovelace')
  assertEquals(out.url, 'https://checkout.stripe.test/three-month')
})

Deno.test('billing service copies interval_count when LawHub is excluded', async () => {
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
          if (id === 'price_core_6_month_test') {
            return {
              id,
              type: 'recurring',
              recurring: { interval: 'month', interval_count: 6 },
              unit_amount: 35400,
              currency: 'usd',
            }
          }
          return { id, type: 'recurring', recurring: { interval: 'month', interval_count: 1 } }
        },
      },
      checkout: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            const lineItems = params.line_items as Array<Record<string, unknown>>
            const priceData = lineItems[0]?.price_data as Record<string, unknown>
            assertEquals(priceData?.unit_amount, 35400)
            assertEquals(priceData?.recurring, { interval: 'month', interval_count: 6 })
            return { url: 'https://checkout.stripe.test/six-month' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'six_month', { includeLawHub: false })
  assertEquals(out.url, 'https://checkout.stripe.test/six-month')
})

Deno.test('billing service rejects a Core price with the wrong interval', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo(),
    stripe: {
      customers: { create: async () => ({ id: 'cus_1' }) },
      prices: {
        retrieve: async () => ({
          id: 'price_core_3_month_test',
          type: 'recurring',
          recurring: { interval: 'month', interval_count: 1 },
        }),
      },
      checkout: { sessions: { create: async () => ({ url: 'https://should-not-run' }) } },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.createCheckoutSession('u-1', 'a@b.com', 'three_month'),
    Error,
    'does not match the three_month plan',
  )
})

Deno.test('billing service createCheckoutSession rejects missing LawHub name', async () => {
  const { LawHubIdentityError } = await import('../_shared/lawhub-student-identity.ts')
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          full_name: 'Prince',
          first_name: 'Prince',
          last_name: null,
          stripe_customer_id: null,
          prep_plus_source: null,
        }
      },
    }),
    stripe: {
      customers: { create: async () => ({ id: 'cus_1' }) },
      prices: { retrieve: async () => ({ id: 'x', type: 'recurring', recurring: { interval: 'month' } }) },
      checkout: { sessions: { create: async () => ({ url: 'https://should-not-run' }) } },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.createCheckoutSession('u-1', 'a@b.com', 'monthly'),
    LawHubIdentityError,
  )
})

Deno.test('billing service createCheckoutSession rejects plus email', async () => {
  const { LawHubIdentityError } = await import('../_shared/lawhub-student-identity.ts')
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo(),
    stripe: {
      customers: { create: async () => ({ id: 'cus_1' }) },
      prices: { retrieve: async () => ({ id: 'x', type: 'recurring', recurring: { interval: 'month' } }) },
      checkout: { sessions: { create: async () => ({ url: 'https://should-not-run' }) } },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.createCheckoutSession('u-1', 'a+tag@b.com', 'monthly'),
    LawHubIdentityError,
  )
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

  const out = await service.createCheckoutSession('u-1', 'a@b.com', 'monthly')
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
        metadata: { plan: 'three_month' },
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

Deno.test('billing service checkout.session.completed invokes onCheckoutCompleted', async () => {
  const seen: { ctx: CheckoutCompletedContext | null } = { ctx: null }
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async upsertSubscription() {},
      async setPrepPlusSource() {},
    }),
    onCheckoutCompleted: async (ctx: CheckoutCompletedContext) => {
      seen.ctx = { ...ctx }
    },
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
      customers: {
        retrieve: async () => ({ id: 'cus_1', name: 'Stripe Customer', deleted: false }),
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await service.handleWebhookEvent({
    id: 'evt_checkout',
    type: 'checkout.session.completed',
    data: {
      object: {
        client_reference_id: 'u-1',
        customer: 'cus_1',
        subscription: 'sub_1',
        customer_email: 'buyer@example.com',
        customer_details: { name: 'Buyer Name' },
        metadata: { plan: 'monthly', include_lawhub: 'true' },
      },
    },
  } as unknown as import('npm:stripe@17.7.0').default.Event)

  assertEquals(seen.ctx?.userId, 'u-1')
  assertEquals(seen.ctx?.email, 'buyer@example.com')
  assertEquals(seen.ctx?.includeLawHub, true)
  assertEquals(seen.ctx?.customerName, 'Buyer Name')
})

Deno.test('getPaymentMethods returns empty when no stripe customer', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo(),
    stripe: {} as unknown as import('npm:stripe@17.7.0').default,
  })
  const out = await service.getPaymentMethods('u-1')
  assertEquals(out.paymentMethods, [])
})

Deno.test('getPaymentMethods maps default card last4 from Stripe', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          full_name: 'Ada Lovelace',
          first_name: 'Ada',
          last_name: 'Lovelace',
          stripe_customer_id: 'cus_1',
          prep_plus_source: 'vendor_subscription',
        }
      },
    }),
    stripe: {
      customers: {
        retrieve: async () => ({
          id: 'cus_1',
          deleted: false,
          invoice_settings: { default_payment_method: 'pm_1' },
        }),
      },
      paymentMethods: {
        list: async () => ({
          data: [
            {
              id: 'pm_1',
              card: {
                brand: 'visa',
                last4: '4242',
                exp_month: 9,
                exp_year: 2028,
                funding: 'credit',
              },
            },
          ],
        }),
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.getPaymentMethods('u-1')
  assertEquals(out.paymentMethods.length, 1)
  assertEquals(out.paymentMethods[0]?.last4, '4242')
  assertEquals(out.paymentMethods[0]?.brandLabel, 'VISA')
  assertEquals(out.paymentMethods[0]?.isDefault, true)
})

Deno.test('getBillingHistory maps paid invoices', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          full_name: 'Ada Lovelace',
          first_name: 'Ada',
          last_name: 'Lovelace',
          stripe_customer_id: 'cus_1',
          prep_plus_source: 'vendor_subscription',
        }
      },
      async getLatestSubscriptionByUserId() {
        return {
          id: 'sub-row-1',
          user_id: 'u-1',
          stripe_subscription_id: 'sub_1',
          stripe_price_id: 'price_core_test',
          status: 'active',
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          livemode: false,
          plan_tier: 'core' as const,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        }
      },
    }),
    stripe: {
      invoices: {
        list: async () => ({
          data: [
            {
              id: 'in_1',
              number: 'INV-2026-008',
              amount_paid: 3900,
              currency: 'usd',
              status: 'paid',
              created: 1_724_500_000,
              invoice_pdf: 'https://stripe.test/pdf',
              hosted_invoice_url: null,
              lines: { data: [{ description: 'Better LSAT Core' }] },
            },
          ],
        }),
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.getBillingHistory('u-1')
  assertEquals(out.invoices.length, 1)
  assertEquals(out.invoices[0]?.number, 'INV-2026-008')
  assertEquals(out.invoices[0]?.amountPaidCents, 3900)
  assertEquals(out.invoices[0]?.title, 'Core Monthly')
})

Deno.test('createBillingPortalSession returns portal url', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getProfileBillingFields() {
        return {
          id: 'u-1',
          email: 'a@b.com',
          full_name: 'Ada Lovelace',
          first_name: 'Ada',
          last_name: 'Lovelace',
          stripe_customer_id: 'cus_1',
          prep_plus_source: 'vendor_subscription',
        }
      },
    }),
    stripe: {
      billingPortal: {
        sessions: {
          create: async (params: Record<string, unknown>) => {
            assertEquals(params.customer, 'cus_1')
            assertEquals(params.return_url, 'http://localhost:5173/app/account')
            const flowData = params.flow_data as {
              type: string
              after_completion: { type: string; redirect: { return_url: string } }
            }
            assertEquals(flowData.type, 'payment_method_update')
            assertEquals(flowData.after_completion.type, 'redirect')
            assertEquals(
              flowData.after_completion.redirect.return_url,
              'http://localhost:5173/app/account',
            )
            return { url: 'https://billing.stripe.test/session' }
          },
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const out = await service.createBillingPortalSession('u-1')
  assertEquals(out.url, 'https://billing.stripe.test/session')
})

function activeSubscription(
  priceId = env.priceIds.monthly,
  schedule: string | null = null,
) {
  return {
    id: 'sub_1',
    status: 'active',
    customer: 'cus_1',
    current_period_start: 1_790_000_000,
    current_period_end: 1_792_678_400,
    cancel_at_period_end: false,
    livemode: false,
    metadata: {},
    schedule,
    items: {
      data: [
        {
          id: 'si_core',
          price: { id: priceId },
          quantity: 1,
        },
        {
          id: 'si_other',
          price: { id: 'price_unrelated' },
          quantity: 2,
        },
      ],
    },
  }
}

function activeSubscriptionRow(priceId = env.priceIds.monthly) {
  return {
    id: 'sub-row-1',
    user_id: 'u-1',
    stripe_subscription_id: 'sub_1',
    stripe_price_id: priceId,
    status: 'active',
    current_period_start: '2026-09-21T14:13:20.000Z',
    current_period_end: '2026-10-22T14:13:20.000Z',
    cancel_at_period_end: false,
    livemode: false,
    plan_tier: 'core' as const,
    created_at: '2026-09-21T14:13:20.000Z',
    updated_at: '2026-09-21T14:13:20.000Z',
  }
}

function priceForPlan(id: string) {
  if (id === env.priceIds.yearly) {
    return { id, type: 'recurring', recurring: { interval: 'year', interval_count: 1 } }
  }
  const intervalCount =
    id === env.priceIds.threeMonth ? 3 :
    id === env.priceIds.sixMonth ? 6 :
    1
  return { id, type: 'recurring', recurring: { interval: 'month', interval_count: intervalCount } }
}

for (
  const [currentPrice, targetPlan, targetPrice] of [
    [env.priceIds.monthly, 'three_month', env.priceIds.threeMonth],
    [env.priceIds.threeMonth, 'monthly', env.priceIds.monthly],
    [env.priceIds.sixMonth, 'yearly', env.priceIds.yearly],
  ] as const
) {
  Deno.test(`schedulePlanChange schedules ${currentPrice} to ${targetPlan} at renewal`, async () => {
    let updateParams: Record<string, unknown> | null = null
    const subscription = activeSubscription(currentPrice)
    const service = createBillingService({
      getEnv: () => env,
      getAppBaseUrl: () => 'http://localhost:5173',
      repository: makeRepo({
        async getLatestSubscriptionByUserId() {
          return activeSubscriptionRow(currentPrice)
        },
      }),
      stripe: {
        subscriptions: {
          retrieve: async () => subscription,
        },
        prices: {
          retrieve: async (id: string) => priceForPlan(id),
        },
        subscriptionSchedules: {
          create: async (params: Record<string, unknown>) => {
            assertEquals(params, { from_subscription: 'sub_1' })
            return {
              id: 'sub_sched_1',
              current_phase: { start_date: subscription.current_period_start },
            }
          },
          update: async (_id: string, params: Record<string, unknown>) => {
            updateParams = params
            return { id: 'sub_sched_1' }
          },
        },
      } as unknown as import('npm:stripe@17.7.0').default,
    })

    const result = await service.schedulePlanChange('u-1', targetPlan)
    assertEquals(result.pendingChange.plan, targetPlan)
    const params = updateParams as unknown as Record<string, unknown>
    const phases = params.phases as Array<Record<string, unknown>>
    assertEquals(params.metadata, {
      managed_by: 'betterlsat_plan_change',
      user_id: 'u-1',
    })
    assertEquals(params.end_behavior, 'release')
    assertEquals(phases[0]?.proration_behavior, 'none')
    assertEquals(phases[1]?.start_date, subscription.current_period_end)
    assertEquals(phases[1]?.proration_behavior, 'none')
    assertEquals(phases[1]?.items, [
      { price: targetPrice, quantity: 1 },
      { price: 'price_unrelated', quantity: 2 },
    ])
  })
}

Deno.test('schedulePlanChange replaces an existing pending destination', async () => {
  let created = false
  let updatedScheduleId = ''
  const subscription = activeSubscription(env.priceIds.monthly, 'sub_sched_existing')
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getLatestSubscriptionByUserId() {
        return activeSubscriptionRow()
      },
    }),
    stripe: {
      subscriptions: { retrieve: async () => subscription },
      prices: { retrieve: async (id: string) => priceForPlan(id) },
      subscriptionSchedules: {
        create: async () => {
          created = true
          return { id: 'unexpected' }
        },
        retrieve: async () => ({
          id: 'sub_sched_existing',
          current_phase: { start_date: subscription.current_period_start },
          metadata: { managed_by: 'betterlsat_plan_change' },
        }),
        update: async (id: string) => {
          updatedScheduleId = id
          return { id }
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await service.schedulePlanChange('u-1', 'yearly')
  assertEquals(created, false)
  assertEquals(updatedScheduleId, 'sub_sched_existing')
})

Deno.test('schedulePlanChange releases a newly created schedule when configuration fails', async () => {
  let released = ''
  const subscription = activeSubscription()
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getLatestSubscriptionByUserId() {
        return activeSubscriptionRow()
      },
    }),
    stripe: {
      subscriptions: { retrieve: async () => subscription },
      prices: { retrieve: async (id: string) => priceForPlan(id) },
      subscriptionSchedules: {
        create: async () => ({
          id: 'sub_sched_incomplete',
          current_phase: { start_date: subscription.current_period_start },
        }),
        update: async () => {
          throw new Error('schedule update failed')
        },
        release: async (id: string) => {
          released = id
          return { id }
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.schedulePlanChange('u-1', 'three_month'),
    Error,
    'schedule update failed',
  )
  assertEquals(released, 'sub_sched_incomplete')
})

Deno.test('cancelScheduledPlanChange releases the schedule without canceling the subscription', async () => {
  let released = ''
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getLatestSubscriptionByUserId() {
        return activeSubscriptionRow()
      },
    }),
    stripe: {
      subscriptions: {
        retrieve: async () => activeSubscription(env.priceIds.monthly, 'sub_sched_1'),
      },
      subscriptionSchedules: {
        retrieve: async () => ({
          id: 'sub_sched_1',
          metadata: { managed_by: 'betterlsat_plan_change' },
        }),
        release: async (id: string) => {
          released = id
          return { id }
        },
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const result = await service.cancelScheduledPlanChange('u-1')
  assertEquals(released, 'sub_sched_1')
  assertEquals(result, { pendingChange: null })
})

Deno.test('getStatus reports the current plan and Stripe-backed pending plan separately', async () => {
  const subscription = activeSubscription(env.priceIds.monthly, 'sub_sched_1')
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getLatestSubscriptionByUserId() {
        return activeSubscriptionRow()
      },
    }),
    stripe: {
      subscriptions: { retrieve: async () => subscription },
      subscriptionSchedules: {
        retrieve: async () => ({
          id: 'sub_sched_1',
          phases: [
            {
              start_date: subscription.current_period_start,
              end_date: subscription.current_period_end,
              items: [{ price: env.priceIds.monthly, quantity: 1 }],
            },
            {
              start_date: subscription.current_period_end,
              items: [{ price: env.priceIds.yearly, quantity: 1 }],
            },
          ],
        }),
      },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  const status = await service.getStatus('u-1')
  assertEquals(status.checkoutPlan, 'monthly')
  assertEquals(status.pendingChange?.plan, 'yearly')
  assertEquals(status.pendingChange?.effectiveAt, '2026-10-22T14:13:20.000Z')
})

Deno.test('schedulePlanChange rejects users without an active subscription', async () => {
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo(),
    stripe: {} as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.schedulePlanChange('u-1', 'monthly'),
    Error,
    'active BetterLSAT subscription',
  )
})

Deno.test('schedulePlanChange rejects subscriptions without a supported BetterLSAT item', async () => {
  const unsupported = activeSubscription('price_unknown')
  unsupported.items.data = unsupported.items.data.filter((item) => item.id !== 'si_other')
  const service = createBillingService({
    getEnv: () => env,
    getAppBaseUrl: () => 'http://localhost:5173',
    repository: makeRepo({
      async getLatestSubscriptionByUserId() {
        return activeSubscriptionRow('price_unknown')
      },
    }),
    stripe: {
      subscriptions: { retrieve: async () => unsupported },
    } as unknown as import('npm:stripe@17.7.0').default,
  })

  await assertRejects(
    () => service.schedulePlanChange('u-1', 'monthly'),
    Error,
    'supported BetterLSAT plan',
  )
})
