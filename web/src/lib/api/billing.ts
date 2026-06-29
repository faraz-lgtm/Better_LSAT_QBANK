import type { SupabaseClient } from '@supabase/supabase-js'

import { handleUsersInvokeError } from '@/lib/auth/handle-unauthorized-session'

export type BillingPlanId = 'core' | 'live'

export type BillingStatus = {
  prepPlusSource: 'vendor_subscription' | 'existing_lsac' | null
  hasActiveSubscription: boolean
  planTier: BillingPlanId | null
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    planTier: BillingPlanId | null
  } | null
}

export type BillingPlanCatalogItem = {
  id: BillingPlanId
  name: string
  tagline: string
  monthlyUsd: number
  dueTodayUsd: number
  dueTodayUsdOwnLsac: number
  badge?: string
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
      plan: BillingPlanId,
      options?: { includeLawHub?: boolean; appBaseUrl?: string },
    ): Promise<string> {
      const { data, error } = await invokeBillingPost<{ url: string }>(
        'billing-create-checkout-session',
        {
          plan,
          includeLawHub: options?.includeLawHub,
          appBaseUrl: options?.appBaseUrl ?? window.location.origin,
        },
      )
      if (error) throw error
      if (!data?.url) throw new Error('No checkout URL in response')
      return data.url
    },

    async getStatus(): Promise<BillingStatus> {
      const { data, error } = await invokeBillingPost<{ status: BillingStatus }>('billing-get-status')
      if (error) throw error
      if (!data?.status) throw new Error('No billing status in response')
      return data.status
    },
  }
}
