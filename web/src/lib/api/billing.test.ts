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
      body: { plan: 'core' },
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
})
