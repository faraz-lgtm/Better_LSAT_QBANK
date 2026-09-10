import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createBillingApi } from './billing'

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 't1' } },
      }),
    },
    functions: { invoke: invokeImpl },
  } as unknown as SupabaseClient
}

describe('createBillingApi', () => {
  it('createCheckoutSession invokes billing-create-checkout-session with plan', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://checkout.stripe.test/session' },
      error: null,
    })
    const api = createBillingApi(mockSupabase(invoke))
    const url = await api.createCheckoutSession('core')
    expect(url).toBe('https://checkout.stripe.test/session')
    expect(invoke).toHaveBeenCalledWith('billing-create-checkout-session', {
      method: 'POST',
      body: {
        plan: 'core',
        includeLawHub: undefined,
        appBaseUrl: window.location.origin,
        successPath: undefined,
      },
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('getPlans invokes billing-get-plans', async () => {
    const catalog = {
      plans: [{ id: 'core', name: 'Core', tagline: '', monthlyUsd: 70, dueTodayUsd: 169 }],
      lsacYearly: { name: 'LawHub Advantage', description: '', yearlyUsd: 99 },
    }
    const invoke = vi.fn().mockResolvedValue({ data: { catalog }, error: null })
    const api = createBillingApi(mockSupabase(invoke))
    const result = await api.getPlans()
    expect(result.plans).toHaveLength(1)
    expect(invoke).toHaveBeenCalledWith('billing-get-plans', {
      method: 'POST',
      body: {},
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('getStatus invokes billing-get-status', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        status: {
          prepPlusSource: null,
          hasActiveSubscription: false,
          planTier: null,
          subscription: null,
        },
      },
      error: null,
    })
    const api = createBillingApi(mockSupabase(invoke))
    const status = await api.getStatus()
    expect(status.hasActiveSubscription).toBe(false)
    expect(invoke).toHaveBeenCalledWith('billing-get-status', {
      method: 'POST',
      body: {},
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('getPaymentMethods invokes billing-get-payment-methods', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        paymentMethods: [
          {
            id: 'pm_1',
            brand: 'visa',
            brandLabel: 'VISA',
            last4: '4242',
            expMonth: 9,
            expYear: 2028,
            funding: 'credit',
            displayLabel: 'Visa Credit',
            isDefault: true,
          },
        ],
      },
      error: null,
    })
    const api = createBillingApi(mockSupabase(invoke))
    const methods = await api.getPaymentMethods()
    expect(methods[0]?.last4).toBe('4242')
    expect(invoke).toHaveBeenCalledWith('billing-get-payment-methods', {
      method: 'POST',
      body: {},
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('getInvoices invokes billing-get-invoices', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        invoices: [
          {
            id: 'in_1',
            number: 'INV-1',
            title: 'Pro Monthly',
            amountPaidCents: 3900,
            currency: 'usd',
            status: 'paid',
            createdAt: '2026-08-24T00:00:00.000Z',
            invoicePdfUrl: 'https://stripe.test/pdf',
            hostedInvoiceUrl: null,
          },
        ],
      },
      error: null,
    })
    const api = createBillingApi(mockSupabase(invoke))
    const invoices = await api.getInvoices()
    expect(invoices).toHaveLength(1)
    expect(invoke).toHaveBeenCalledWith('billing-get-invoices', {
      method: 'POST',
      body: {},
      headers: { Authorization: 'Bearer t1' },
    })
  })

  it('createBillingPortalSession invokes billing-create-portal-session', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://billing.stripe.test/session' },
      error: null,
    })
    const api = createBillingApi(mockSupabase(invoke))
    const url = await api.createBillingPortalSession({ appBaseUrl: 'http://localhost:5173' })
    expect(url).toBe('https://billing.stripe.test/session')
    expect(invoke).toHaveBeenCalledWith('billing-create-portal-session', {
      method: 'POST',
      body: { appBaseUrl: 'http://localhost:5173' },
      headers: { Authorization: 'Bearer t1' },
    })
  })
})
