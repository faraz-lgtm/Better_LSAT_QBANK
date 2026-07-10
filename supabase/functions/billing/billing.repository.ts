import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { PrepPlusSource, BillingPlanId } from '../_shared/stripe-env.ts'

export type BillingSubscriptionRow = {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  livemode: boolean
  plan_tier: BillingPlanId | null
  created_at: string
  updated_at: string
}

export type BillingProfileBillingFields = {
  id: string
  email: string | null
  stripe_customer_id: string | null
  prep_plus_source: PrepPlusSource | null
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

export function isActiveSubscriptionStatus(status: string): boolean {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status.trim().toLowerCase())
}

export function createBillingRepository(client: SupabaseClient) {
  return {
    async getProfileBillingFields(userId: string): Promise<BillingProfileBillingFields | null> {
      const { data, error } = await client
        .from('profiles')
        .select('id,email,stripe_customer_id,prep_plus_source')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data as BillingProfileBillingFields | null
    },

    async setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
      const { error } = await client
        .from('profiles')
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) throw error
    },

    async setPrepPlusSource(userId: string, source: PrepPlusSource): Promise<void> {
      const { error } = await client
        .from('profiles')
        .update({
          prep_plus_source: source,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
      if (error) throw error
    },

    async getLatestSubscriptionByUserId(userId: string): Promise<BillingSubscriptionRow | null> {
      const { data, error } = await client
        .from('billing_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as BillingSubscriptionRow | null
    },

    async getProfileIdByStripeCustomerId(customerId: string): Promise<string | null> {
      const { data, error } = await client
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (error) throw error
      return data?.id ?? null
    },

    async upsertSubscription(input: {
      userId: string
      stripeSubscriptionId: string
      stripePriceId: string
      status: string
      currentPeriodStart: string | null
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
      livemode: boolean
      planTier: BillingPlanId | null
    }): Promise<void> {
      const { error } = await client.from('billing_subscriptions').upsert(
        {
          user_id: input.userId,
          stripe_subscription_id: input.stripeSubscriptionId,
          stripe_price_id: input.stripePriceId,
          status: input.status,
          current_period_start: input.currentPeriodStart,
          current_period_end: input.currentPeriodEnd,
          cancel_at_period_end: input.cancelAtPeriodEnd,
          livemode: input.livemode,
          plan_tier: input.planTier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' },
      )
      if (error) throw error
    },

    async hasActiveSubscription(userId: string): Promise<boolean> {
      const sub = await this.getLatestSubscriptionByUserId(userId)
      return sub != null && isActiveSubscriptionStatus(sub.status)
    },

    async recordWebhookEventIfNew(
      stripeEventId: string,
      eventType: string,
      payload: Record<string, unknown>,
    ): Promise<boolean> {
      const { data, error } = await client
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: stripeEventId,
          event_type: eventType,
          payload,
        })
        .select('stripe_event_id')
        .maybeSingle()
      if (error) {
        if (error.code === '23505') return false
        throw error
      }
      return Boolean(data)
    },
  }
}

export type BillingRepository = ReturnType<typeof createBillingRepository>
