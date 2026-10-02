import type Stripe from 'npm:stripe@17.7.0'
import {
  assertLawHubEmailAllowed,
  joinLawHubFullName,
  requireLawHubNameParts,
} from '../_shared/lawhub-student-identity.ts'
import {
  BILLING_PLAN_CATALOG,
  type BillingPlanId,
  resolvePlanFromPriceId,
  type StripeRuntimeEnv,
} from '../_shared/stripe-env.ts'
import type { BillingRepository } from './billing.repository.ts'
import { isActiveSubscriptionStatus } from './billing.repository.ts'

export type CheckoutCompletedContext = {
  userId: string
  email: string | null
  includeLawHub: boolean
  customerName: string | null
}

export type BillingServiceDeps = {
  getEnv: () => StripeRuntimeEnv
  stripe: Stripe
  repository: BillingRepository
  getAppBaseUrl: () => string
  onCheckoutCompleted?: (ctx: CheckoutCompletedContext) => Promise<void>
}

function unixToIso(seconds: number | null | undefined): string | null {
  if (seconds == null) return null
  return new Date(seconds * 1000).toISOString()
}

function subscriptionPriceId(subscription: Stripe.Subscription): string {
  const item = subscription.items.data[0]
  return item?.price?.id ?? ''
}

function parseCheckoutPlan(value: unknown): BillingPlanId {
  if (value === 'core' || value === 'live') return value
  throw new Error('plan must be core or live')
}

const DEFAULT_CHECKOUT_SUCCESS_PATH = '/app?checkout=success'

function parseCheckoutSuccessPath(value: unknown): string {
  if (value == null || value === '') return DEFAULT_CHECKOUT_SUCCESS_PATH
  if (typeof value !== 'string') throw new Error('successPath must be a string')
  const trimmed = value.trim()
  if (trimmed.includes('..')) {
    throw new Error('successPath must be an in-app path starting with /app')
  }
  if (!(trimmed === '/app' || trimmed.startsWith('/app/') || trimmed.startsWith('/app?'))) {
    throw new Error('successPath must be an in-app path starting with /app')
  }
  return trimmed
}

async function validatePlanPrice(stripe: Stripe, recurringPriceId: string): Promise<void> {
  const recurring = await stripe.prices.retrieve(recurringPriceId)

  if (recurring.type !== 'recurring' || recurring.recurring?.interval !== 'month') {
    throw new Error('Core/Live Stripe price must be a recurring monthly price.')
  }
}

const EXISTING_LSAC_CHECKOUT_NOTE =
  'Better LSAT membership only. You keep your existing LawHub PrepPlus through LSAC — no LawHub fee from Better LSAT.'

/** Vendor path uses stable Stripe Price IDs; existing-LSAC path uses inline product copy for Checkout display. */
async function buildSubscriptionCheckoutLineItem(
  stripe: Stripe,
  priceId: string,
  plan: BillingPlanId,
  includeLawHub: boolean,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  if (includeLawHub) {
    return { price: priceId, quantity: 1 }
  }

  const price = await stripe.prices.retrieve(priceId)
  const catalog = plan === 'live' ? BILLING_PLAN_CATALOG.live : BILLING_PLAN_CATALOG.core

  if (price.type !== 'recurring' || price.recurring?.interval !== 'month') {
    throw new Error('Core/Live Stripe price must be a recurring monthly price.')
  }

  return {
    price_data: {
      currency: price.currency ?? 'usd',
      unit_amount: price.unit_amount ?? catalog.monthlyUsd * 100,
      recurring: { interval: 'month' },
      product_data: {
        name: `Better LSAT ${catalog.name}`,
        description: `${catalog.tagline} ${EXISTING_LSAC_CHECKOUT_NOTE}`,
      },
    },
    quantity: 1,
  }
}

/** LawHub cannot be a yearly recurring line item with a monthly plan — Stripe rejects mixed intervals. */
async function buildLawHubCheckoutLineItem(
  stripe: Stripe,
  lsacPriceId: string,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const lsac = await stripe.prices.retrieve(lsacPriceId, { expand: ['product'] })
  const catalog = BILLING_PLAN_CATALOG.lsacYearly

  if (lsac.type === 'one_time') {
    return { price: lsacPriceId, quantity: 1 }
  }

  if (lsac.type === 'recurring' && lsac.recurring?.interval === 'year') {
    const productName =
      typeof lsac.product === 'object' && lsac.product && 'name' in lsac.product &&
        typeof lsac.product.name === 'string'
        ? lsac.product.name
        : catalog.name

    return {
      price_data: {
        currency: lsac.currency ?? 'usd',
        unit_amount: lsac.unit_amount ?? catalog.yearlyUsd * 100,
        product_data: {
          name: productName,
          description: catalog.description,
        },
      },
      quantity: 1,
    }
  }

  throw new Error(
    'LawHub Advantage Stripe price must be one-time or recurring yearly. Other intervals are not supported.',
  )
}

export function createBillingService(deps: BillingServiceDeps) {
  async function resolveUserIdFromCustomer(customerId: string): Promise<string | null> {
    return await deps.repository.getProfileIdByStripeCustomerId(customerId)
  }

  async function syncSubscription(
    userId: string,
    subscription: Stripe.Subscription,
    planHint: BillingPlanId | null = null,
  ): Promise<void> {
    const env = deps.getEnv()
    const stripePriceId = subscriptionPriceId(subscription)
    const planTier =
      planHint ?? resolvePlanFromPriceId(env.priceIds, stripePriceId)
    await deps.repository.upsertSubscription({
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      status: subscription.status,
      currentPeriodStart: unixToIso(subscription.current_period_start),
      currentPeriodEnd: unixToIso(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      livemode: subscription.livemode,
      planTier,
    })
    if (isActiveSubscriptionStatus(subscription.status)) {
      const profile = await deps.repository.getProfileBillingFields(userId)
      if (profile?.prep_plus_source !== 'existing_lsac') {
        await deps.repository.setPrepPlusSource(userId, 'vendor_subscription')
      }
    }
  }

  return {
    getPublicConfig() {
      const env = deps.getEnv()
      return {
        publishableKey: env.publishableKey,
        liveMode: env.liveMode,
      }
    },

    getPlans() {
      const { core, live, lsacYearly } = BILLING_PLAN_CATALOG
      return {
        plans: [
          {
            id: core.id,
            name: core.name,
            tagline: core.tagline,
            monthlyUsd: core.monthlyUsd,
            dueTodayUsd: core.monthlyUsd + lsacYearly.yearlyUsd,
            dueTodayUsdOwnLsac: core.monthlyUsd,
          },
          {
            id: live.id,
            name: live.name,
            tagline: live.tagline,
            monthlyUsd: live.monthlyUsd,
            badge: live.badge,
            dueTodayUsd: live.monthlyUsd + lsacYearly.yearlyUsd,
            dueTodayUsdOwnLsac: live.monthlyUsd,
          },
        ],
        lsacYearly: {
          name: lsacYearly.name,
          description: lsacYearly.description,
          yearlyUsd: lsacYearly.yearlyUsd,
        },
      }
    },

    async getStatus(userId: string) {
      const profile = await deps.repository.getProfileBillingFields(userId)
      const subscription = await deps.repository.getLatestSubscriptionByUserId(userId)
      const hasActiveSubscription =
        subscription != null && isActiveSubscriptionStatus(subscription.status)
      return {
        prepPlusSource: profile?.prep_plus_source ?? null,
        hasActiveSubscription,
        planTier: subscription?.plan_tier ?? null,
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              planTier: subscription.plan_tier,
            }
          : null,
      }
    },

    async createCheckoutSession(
      userId: string,
      email: string | null,
      plan: BillingPlanId,
      options: { includeLawHub?: boolean; successPath?: string } = {},
    ): Promise<{ url: string }> {
      const includeLawHub = options.includeLawHub !== false
      const successPath = options.successPath ?? DEFAULT_CHECKOUT_SUCCESS_PATH
      const env = deps.getEnv()
      const profile = await deps.repository.getProfileBillingFields(userId)

      // Gate before Stripe: LawHub invite after payment needs a valid email + first/last name.
      const checkoutEmail = assertLawHubEmailAllowed(email ?? profile?.email)
      const nameParts = requireLawHubNameParts({
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        fullName: profile?.full_name,
      })
      const profileName = joinLawHubFullName(nameParts.firstName, nameParts.lastName)
      let customerId = profile?.stripe_customer_id?.trim() ?? ''

      if (!customerId) {
        const customer = await deps.stripe.customers.create({
          email: checkoutEmail,
          name: profileName,
          metadata: { user_id: userId },
        })
        customerId = customer.id
        await deps.repository.setStripeCustomerId(userId, customerId)
      } else {
        await deps.stripe.customers.update(customerId, {
          email: checkoutEmail,
          name: profileName,
        })
      }

      const recurringPriceId =
        plan === 'live' ? env.priceIds.live : env.priceIds.core
      await validatePlanPrice(deps.stripe, recurringPriceId)

      if (!includeLawHub) {
        await deps.repository.setPrepPlusSource(userId, 'existing_lsac')
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        await buildSubscriptionCheckoutLineItem(
          deps.stripe,
          recurringPriceId,
          plan,
          includeLawHub,
        ),
      ]
      if (includeLawHub) {
        lineItems.push(
          await buildLawHubCheckoutLineItem(deps.stripe, env.priceIds.lsacYearly),
        )
      }

      const baseUrl = deps.getAppBaseUrl().replace(/\/$/, '')
      const session = await deps.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: userId,
        line_items: lineItems,
        success_url: `${baseUrl}${successPath.startsWith('/') ? successPath : `/${successPath}`}`,
        cancel_url: `${baseUrl}/app/pricing?checkout=cancel`,
        metadata: { user_id: userId, plan, include_lawhub: includeLawHub ? 'true' : 'false' },
        subscription_data: {
          metadata: { user_id: userId, plan },
        },
        ...(includeLawHub
          ? {}
          : {
            custom_text: {
              submit: {
                message: EXISTING_LSAC_CHECKOUT_NOTE,
              },
            },
          }),
      })

      if (!session.url) {
        throw new Error('Stripe checkout session missing url')
      }
      return { url: session.url }
    },

    async handleWebhookEvent(event: Stripe.Event): Promise<void> {
      const isNew = await deps.repository.recordWebhookEventIfNew(
        event.id,
        event.type,
        event as unknown as Record<string, unknown>,
      )
      if (!isNew) return

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const userId =
            session.client_reference_id ??
            session.metadata?.user_id ??
            (session.customer
              ? await resolveUserIdFromCustomer(
                  typeof session.customer === 'string'
                    ? session.customer
                    : session.customer.id,
                )
              : null)
          if (!userId) break
          const customerId =
            typeof session.customer === 'string' ? session.customer : session.customer?.id
          if (customerId) {
            await deps.repository.setStripeCustomerId(userId, customerId)
          }
          const planHint =
            session.metadata?.plan === 'core' || session.metadata?.plan === 'live'
              ? session.metadata.plan
              : null
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id
          if (subscriptionId) {
            const subscription = await deps.stripe.subscriptions.retrieve(subscriptionId)
            await syncSubscription(userId, subscription, planHint)
          }
          if (deps.onCheckoutCompleted) {
            let customerName = session.customer_details?.name ?? null
            if (!customerName?.trim() && customerId) {
              try {
                const customer = await deps.stripe.customers.retrieve(customerId)
                if (!customer.deleted) {
                  customerName = customer.name ?? null
                }
              } catch (error) {
                console.warn('Failed to retrieve Stripe customer for LawHub name lookup:', error)
              }
            }
            const includeLawHub = session.metadata?.include_lawhub !== 'false'
            const email =
              session.customer_email ??
              session.customer_details?.email ??
              null
            await deps.onCheckoutCompleted({
              userId,
              email,
              includeLawHub,
              customerName,
            })
          }
          break
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id
          const userId = await resolveUserIdFromCustomer(customerId)
          if (!userId) break
          const planHint =
            subscription.metadata?.plan === 'core' || subscription.metadata?.plan === 'live'
              ? subscription.metadata.plan
              : null
          await syncSubscription(userId, subscription, planHint)
          break
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice
          const subscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription?.id
          if (!subscriptionId) break
          const subscription = await deps.stripe.subscriptions.retrieve(subscriptionId)
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id
          const userId = await resolveUserIdFromCustomer(customerId)
          if (!userId) break
          const planHint =
            subscription.metadata?.plan === 'core' || subscription.metadata?.plan === 'live'
              ? subscription.metadata.plan
              : null
          await syncSubscription(userId, subscription, planHint)
          break
        }
        default:
          break
      }
    },
  }
}

export type BillingService = ReturnType<typeof createBillingService>
export { parseCheckoutPlan, parseCheckoutSuccessPath }
