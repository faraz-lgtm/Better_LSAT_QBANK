import type { SupabaseClient } from '@supabase/supabase-js'

import { AnalyticsEvent, captureEvent } from '@/lib/analytics/posthog'
import { handleUsersInvokeError } from '@/lib/auth/handle-unauthorized-session'

export type CheckoutPlanId = 'monthly' | 'three_month' | 'six_month' | 'yearly'
export type StoredPlanTier = 'core' | 'live'

export type PendingPlanChange = {
  plan: CheckoutPlanId
  effectiveAt: string
}

export type BillingStatus = {
  prepPlusSource: 'vendor_subscription' | 'existing_lsac' | null
  hasActiveSubscription: boolean
  planTier: StoredPlanTier | null
  checkoutPlan: CheckoutPlanId | null
  pendingChange: PendingPlanChange | null
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    planTier: StoredPlanTier | null
    checkoutPlan: CheckoutPlanId | null
  } | null
}

export type BillingPlanCatalogItem = {
  id: CheckoutPlanId
  name: string
  headline: string
  description: string
  priceUsd: number
  equivalentMonthlyUsd: number | null
  discountLabel: string | null
  badge: string | null
  intervalCount: 1 | 3 | 6 | 12
  renewalNote: string
  dueTodayUsd: number
  dueTodayUsdOwnLsac: number
}

export type BillingCatalog = {
  plans: BillingPlanCatalogItem[]
  lsacYearly: {
    name: string
    description: string
    yearlyUsd: number
  }
}

export type BillingPublicConfig = {
  publishableKey: string
  liveMode: boolean
}

export type BillingPaymentMethod = {
  id: string
  brand: string
  brandLabel: string
  last4: string
  expMonth: number
  expYear: number
  funding: string | null
  displayLabel: string
  isDefault: boolean
}

export type BillingInvoice = {
  id: string
  number: string | null
  title: string
  amountPaidCents: number
  currency: string
  status: string
  createdAt: string
  invoicePdfUrl: string | null
  hostedInvoiceUrl: string | null
}

export function createBillingApi(supabase: SupabaseClient) {
  async function invokeBillingPost<T>(
    functionName: string,
    body?: Record<string, unknown>,
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    const result = await supabase.functions.invoke<T>(functionName, {
      method: 'POST',
      body: body ?? {},
      headers,
    })
    if (result.error) await handleUsersInvokeError(supabase, result.error)
    return result
  }

  return {
    async getPublicConfig(): Promise<BillingPublicConfig> {
      const { data, error } = await invokeBillingPost<{ config: BillingPublicConfig }>(
        'billing-get-public-config',
      )
      if (error) throw error
      if (!data?.config) throw new Error('No billing config in response')
      return data.config
    },

    async getPlans(): Promise<BillingCatalog> {
      const { data, error } = await invokeBillingPost<{ catalog: BillingCatalog }>('billing-get-plans')
      if (error) throw error
      if (!data?.catalog) throw new Error('No billing catalog in response')
      return data.catalog
    },

    async createCheckoutSession(
      plan: CheckoutPlanId,
      options?: { includeLawHub?: boolean; appBaseUrl?: string; successPath?: string },
    ): Promise<string> {
      const { data, error } = await invokeBillingPost<{ url: string }>(
        'billing-create-checkout-session',
        {
          plan,
          includeLawHub: options?.includeLawHub,
          appBaseUrl: options?.appBaseUrl ?? window.location.origin,
          successPath: options?.successPath,
        },
      )
      if (error) throw error
      if (!data?.url) throw new Error('No checkout URL in response')
      captureEvent(AnalyticsEvent.checkoutStarted, {
        plan,
        include_law_hub: Boolean(options?.includeLawHub),
      })
      return data.url
    },

    async getStatus(): Promise<BillingStatus> {
      const { data, error } = await invokeBillingPost<{ status: BillingStatus }>('billing-get-status')
      if (error) throw error
      if (!data?.status) throw new Error('No billing status in response')
      return data.status
    },

    async schedulePlanChange(plan: CheckoutPlanId): Promise<PendingPlanChange> {
      const { data, error } = await invokeBillingPost<{ pendingChange: PendingPlanChange }>(
        'billing-change-plan',
        { plan },
      )
      if (error) throw error
      if (!data?.pendingChange) throw new Error('No pending plan change in response')
      return data.pendingChange
    },

    async cancelScheduledPlanChange(): Promise<void> {
      const { error } = await invokeBillingPost<{ pendingChange: null }>(
        'billing-change-plan',
        { cancelPending: true },
      )
      if (error) throw error
    },

    async getPaymentMethods(): Promise<BillingPaymentMethod[]> {
      const { data, error } = await invokeBillingPost<{ paymentMethods: BillingPaymentMethod[] }>(
        'billing-get-payment-methods',
      )
      if (error) throw error
      return data?.paymentMethods ?? []
    },

    async getInvoices(): Promise<BillingInvoice[]> {
      const { data, error } = await invokeBillingPost<{ invoices: BillingInvoice[] }>(
        'billing-get-invoices',
      )
      if (error) throw error
      return data?.invoices ?? []
    },

    async createBillingPortalSession(options?: { appBaseUrl?: string }): Promise<string> {
      const { data, error } = await invokeBillingPost<{ url: string }>(
        'billing-create-portal-session',
        {
          appBaseUrl: options?.appBaseUrl ?? window.location.origin,
        },
      )
      if (error) throw error
      if (!data?.url) throw new Error('No billing portal URL in response')
      return data.url
    },
  }
}
