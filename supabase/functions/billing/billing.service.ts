import type Stripe from 'npm:stripe@17.7.0'
import { capturePostHogEvent } from '../_shared/posthog.ts'
import {
  assertLawHubEmailAllowed,
  joinLawHubFullName,
  requireLawHubNameParts,
} from '../_shared/lawhub-student-identity.ts'
import {
  BILLING_PLAN_CATALOG,
  CHECKOUT_PLANS,
  type BillingPlanId,
  type CheckoutPlanId,
  checkoutPlanFromId,
  priceIdForCheckoutPlan,
  resolveCheckoutPlanFromPriceId,
  resolvePlanFromPriceId,
  storedPlanTierFromMetadata,
  type StripeRuntimeEnv,
} from '../_shared/stripe-env.ts'
import type { BillingRepository } from './billing.repository.ts'
import { isActiveSubscriptionStatus } from './billing.repository.ts'
import {
  mapStripeCardPaymentMethod,
  mapStripeInvoice,
  type BillingInvoiceDto,
  type BillingPaymentMethodDto,
} from './billing-payment-mapper.ts'

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

function subscriptionItemPriceId(item: Stripe.SubscriptionItem): string {
  return item.price?.id ?? ''
}

function subscriptionScheduleId(subscription: Stripe.Subscription): string | null {
  if (!subscription.schedule) return null
  return typeof subscription.schedule === 'string'
    ? subscription.schedule
    : subscription.schedule.id
}

function coreSubscriptionItem(
  subscription: Stripe.Subscription,
  env: StripeRuntimeEnv,
): Stripe.SubscriptionItem | null {
  return subscription.items.data.find((item) =>
    resolveCheckoutPlanFromPriceId(env.priceIds, subscriptionItemPriceId(item)) != null
  ) ?? null
}

function billingSubscriptionItem(
  subscription: Stripe.Subscription,
  env: StripeRuntimeEnv,
): Stripe.SubscriptionItem | null {
  return subscription.items.data.find((item) =>
    resolvePlanFromPriceId(env.priceIds, subscriptionItemPriceId(item)) != null
  ) ?? null
}

function scheduleItemPriceId(item: Stripe.SubscriptionSchedule.Phase.Item): string {
  return typeof item.price === 'string' ? item.price : item.price?.id ?? ''
}

async function pendingPlanChange(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  env: StripeRuntimeEnv,
): Promise<{ plan: CheckoutPlanId; effectiveAt: string } | null> {
  const scheduleId = subscriptionScheduleId(subscription)
  if (!scheduleId) return null

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)
  const nextPhase = schedule.phases
    .filter((phase) => phase.start_date >= subscription.current_period_end)
    .sort((a, b) => a.start_date - b.start_date)[0]
  if (!nextPhase) return null

  const nextPlan = nextPhase.items
    .map((item) => resolveCheckoutPlanFromPriceId(env.priceIds, scheduleItemPriceId(item)))
    .find((plan): plan is CheckoutPlanId => plan != null)
  if (!nextPlan) return null

  const currentItem = coreSubscriptionItem(subscription, env)
  const currentPlan = currentItem
    ? resolveCheckoutPlanFromPriceId(env.priceIds, subscriptionItemPriceId(currentItem))
    : null
  if (nextPlan === currentPlan) return null

  return {
    plan: nextPlan,
    effectiveAt: unixToIso(nextPhase.start_date)!,
  }
}

function parseCheckoutPlan(value: unknown): CheckoutPlanId {
  if (
    value === 'monthly' ||
    value === 'three_month' ||
    value === 'six_month' ||
    value === 'yearly'
  ) return value
  throw new Error('plan must be monthly, three_month, six_month, or yearly')
}

const DEFAULT_CHECKOUT_SUCCESS_PATH = '/onboarding?checkout=success'

function parseCheckoutSuccessPath(value: unknown): string {
  if (value == null || value === '') return DEFAULT_CHECKOUT_SUCCESS_PATH
  if (typeof value !== 'string') throw new Error('successPath must be a string')
  const trimmed = value.trim()
  if (trimmed.includes('..')) {
    throw new Error('successPath must be an allowed in-app path')
  }
  const isAppPath =
    trimmed === '/app' || trimmed.startsWith('/app/') || trimmed.startsWith('/app?')
  const isOnboardingPath =
    trimmed === '/onboarding' || trimmed.startsWith('/onboarding?')
  if (!isAppPath && !isOnboardingPath) {
    throw new Error('successPath must be an allowed in-app path')
  }
  return trimmed
}

function expectedIntervalCount(plan: CheckoutPlanId): 1 | 3 | 6 | 12 {
  return checkoutPlanFromId(plan).intervalCount
}

async function validatePlanPrice(
  stripe: Stripe,
  recurringPriceId: string,
  plan: CheckoutPlanId,
): Promise<Stripe.Price> {
  const recurring = await stripe.prices.retrieve(recurringPriceId)
  const intervalCount = recurring.recurring?.interval_count ?? 1
  const interval = recurring.recurring?.interval
  const expectedInterval =
    plan === 'yearly'
      ? (interval === 'year' && intervalCount === 1) ||
        (interval === 'month' && intervalCount === 12)
      : interval === 'month' && intervalCount === expectedIntervalCount(plan)

  if (
    recurring.type !== 'recurring' ||
    !expectedInterval
  ) {
    throw new Error(
      `Core Stripe price interval does not match the ${plan} plan.`,
    )
  }

  return recurring
}

const EXISTING_LSAC_CHECKOUT_NOTE =
  'Better LSAT membership only. You keep your existing LawHub PrepPlus through LSAC — no LawHub fee from Better LSAT.'
const BETTERLSAT_PLAN_CHANGE_SCHEDULE = 'betterlsat_plan_change'

/** Vendor path uses stable Stripe Price IDs; existing-LSAC path uses inline product copy for Checkout display. */
async function buildSubscriptionCheckoutLineItem(
  stripe: Stripe,
  priceId: string,
  plan: CheckoutPlanId,
  includeLawHub: boolean,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const price = await validatePlanPrice(stripe, priceId, plan)
  if (includeLawHub) {
    return { price: priceId, quantity: 1 }
  }

  const catalog = checkoutPlanFromId(plan)
  const intervalCount = price.recurring?.interval_count ?? catalog.intervalCount

  return {
    price_data: {
      currency: price.currency ?? 'usd',
      unit_amount: price.unit_amount ?? catalog.priceUsd * 100,
      recurring: { interval: 'month', interval_count: intervalCount },
      product_data: {
        name: `Better LSAT ${catalog.name}`,
        description: `${catalog.description} ${EXISTING_LSAC_CHECKOUT_NOTE}`,
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
    const billingItem = billingSubscriptionItem(subscription, env)
    const stripePriceId = billingItem ? subscriptionItemPriceId(billingItem) : ''
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
      const { lsacYearly } = BILLING_PLAN_CATALOG
      return {
        plans: CHECKOUT_PLANS.map((plan) => ({
          id: plan.id,
          name: plan.name,
          headline: plan.headline,
          description: plan.description,
          priceUsd: plan.priceUsd,
          equivalentMonthlyUsd: plan.equivalentMonthlyUsd,
          discountLabel: plan.discountLabel,
          badge: plan.badge,
          intervalCount: plan.intervalCount,
          renewalNote: plan.renewalNote,
          dueTodayUsd: plan.priceUsd + lsacYearly.yearlyUsd,
          dueTodayUsdOwnLsac: plan.priceUsd,
        })),
        lsacYearly: {
          name: lsacYearly.name,
          description: lsacYearly.description,
          yearlyUsd: lsacYearly.yearlyUsd,
        },
      }
    },

    async getStatus(userId: string) {
      const env = deps.getEnv()
      const profile = await deps.repository.getProfileBillingFields(userId)
      const storedSubscription = await deps.repository.getLatestSubscriptionByUserId(userId)
      const hasActiveSubscription =
        storedSubscription != null && isActiveSubscriptionStatus(storedSubscription.status)
      const stripeSubscription = hasActiveSubscription
        ? await deps.stripe.subscriptions.retrieve(storedSubscription!.stripe_subscription_id)
        : null
      const currentItem = stripeSubscription
        ? coreSubscriptionItem(stripeSubscription, env)
        : null
      const checkoutPlan = currentItem
        ? resolveCheckoutPlanFromPriceId(env.priceIds, subscriptionItemPriceId(currentItem))
        : storedSubscription
        ? resolveCheckoutPlanFromPriceId(env.priceIds, storedSubscription.stripe_price_id)
        : null
      const pendingChange = stripeSubscription
        ? await pendingPlanChange(deps.stripe, stripeSubscription, env)
        : null
      return {
        prepPlusSource: profile?.prep_plus_source ?? null,
        hasActiveSubscription,
        planTier: storedSubscription?.plan_tier ?? null,
        checkoutPlan,
        pendingChange,
        subscription: storedSubscription
          ? {
              status: stripeSubscription?.status ?? storedSubscription.status,
              currentPeriodEnd:
                unixToIso(stripeSubscription?.current_period_end) ??
                storedSubscription.current_period_end,
              cancelAtPeriodEnd:
                stripeSubscription?.cancel_at_period_end ??
                storedSubscription.cancel_at_period_end,
              planTier: storedSubscription.plan_tier,
              checkoutPlan,
            }
          : null,
      }
    },

    async schedulePlanChange(userId: string, plan: CheckoutPlanId) {
      const env = deps.getEnv()
      const storedSubscription = await deps.repository.getLatestSubscriptionByUserId(userId)
      if (!storedSubscription || !isActiveSubscriptionStatus(storedSubscription.status)) {
        throw new Error('An active BetterLSAT subscription is required to change plans.')
      }

      const subscription = await deps.stripe.subscriptions.retrieve(
        storedSubscription.stripe_subscription_id,
      )
      if (!isActiveSubscriptionStatus(subscription.status)) {
        throw new Error('An active BetterLSAT subscription is required to change plans.')
      }
      if (subscription.cancel_at_period_end) {
        throw new Error('Reactivate the subscription before scheduling a plan change.')
      }

      const currentItem = coreSubscriptionItem(subscription, env)
      if (!currentItem) {
        throw new Error('The active subscription does not contain a supported BetterLSAT plan.')
      }
      const currentPlan = resolveCheckoutPlanFromPriceId(
        env.priceIds,
        subscriptionItemPriceId(currentItem),
      )
      if (currentPlan === plan) {
        throw new Error('The selected plan is already active.')
      }

      const targetPriceId = priceIdForCheckoutPlan(env.priceIds, plan)
      await validatePlanPrice(deps.stripe, targetPriceId, plan)

      let scheduleId = subscriptionScheduleId(subscription)
      let createdSchedule = false
      let schedule: Stripe.SubscriptionSchedule
      if (scheduleId) {
        schedule = await deps.stripe.subscriptionSchedules.retrieve(scheduleId)
        if (schedule.metadata?.managed_by !== BETTERLSAT_PLAN_CHANGE_SCHEDULE) {
          throw new Error('This subscription already has a schedule managed outside BetterLSAT.')
        }
      } else {
        schedule = await deps.stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
        })
        scheduleId = schedule.id
        createdSchedule = true
      }

      const currentPhaseStart =
        schedule.current_phase?.start_date ?? subscription.current_period_start
      const currentItems = subscription.items.data.map((item) => ({
        price: subscriptionItemPriceId(item),
        quantity: item.quantity ?? 1,
      }))
      const nextItems = subscription.items.data.map((item) => ({
        price: item.id === currentItem.id ? targetPriceId : subscriptionItemPriceId(item),
        quantity: item.quantity ?? 1,
      }))

      try {
        await deps.stripe.subscriptionSchedules.update(scheduleId, {
          metadata: {
            managed_by: BETTERLSAT_PLAN_CHANGE_SCHEDULE,
            user_id: userId,
          },
          end_behavior: 'release',
          phases: [
            {
              start_date: currentPhaseStart,
              end_date: subscription.current_period_end,
              items: currentItems,
              proration_behavior: 'none',
            },
            {
              start_date: subscription.current_period_end,
              items: nextItems,
              proration_behavior: 'none',
              metadata: { plan },
            },
          ],
        })
      } catch (error) {
        if (createdSchedule) {
          try {
            await deps.stripe.subscriptionSchedules.release(scheduleId)
          } catch (releaseError) {
            console.error('Failed to release incomplete plan-change schedule:', releaseError)
          }
        }
        throw error
      }

      return {
        pendingChange: {
          plan,
          effectiveAt: unixToIso(subscription.current_period_end)!,
        },
      }
    },

    async cancelScheduledPlanChange(userId: string) {
      const storedSubscription = await deps.repository.getLatestSubscriptionByUserId(userId)
      if (!storedSubscription || !isActiveSubscriptionStatus(storedSubscription.status)) {
        throw new Error('An active BetterLSAT subscription is required to change plans.')
      }
      const subscription = await deps.stripe.subscriptions.retrieve(
        storedSubscription.stripe_subscription_id,
      )
      const scheduleId = subscriptionScheduleId(subscription)
      if (scheduleId) {
        const schedule = await deps.stripe.subscriptionSchedules.retrieve(scheduleId)
        if (schedule.metadata?.managed_by !== BETTERLSAT_PLAN_CHANGE_SCHEDULE) {
          throw new Error('This subscription already has a schedule managed outside BetterLSAT.')
        }
        await deps.stripe.subscriptionSchedules.release(scheduleId)
      }
      return { pendingChange: null }
    },

    async getPaymentMethods(userId: string): Promise<{ paymentMethods: BillingPaymentMethodDto[] }> {
      const profile = await deps.repository.getProfileBillingFields(userId)
      const customerId = profile?.stripe_customer_id?.trim() ?? ''
      if (!customerId) return { paymentMethods: [] }

      const customer = await deps.stripe.customers.retrieve(customerId)
      if (customer.deleted) return { paymentMethods: [] }

      const defaultPm =
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings?.default_payment_method?.id ?? null

      const listed = await deps.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
        limit: 10,
      })

      const paymentMethods = listed.data
        .filter((pm) => pm.card != null)
        .map((pm) =>
          mapStripeCardPaymentMethod({
            id: pm.id,
            brand: pm.card!.brand,
            last4: pm.card!.last4,
            expMonth: pm.card!.exp_month,
            expYear: pm.card!.exp_year,
            funding: pm.card!.funding ?? null,
            isDefault: defaultPm != null ? pm.id === defaultPm : listed.data[0]?.id === pm.id,
          })
        )

      return { paymentMethods }
    },

    async getBillingHistory(userId: string): Promise<{ invoices: BillingInvoiceDto[] }> {
      const profile = await deps.repository.getProfileBillingFields(userId)
      const customerId = profile?.stripe_customer_id?.trim() ?? ''
      if (!customerId) return { invoices: [] }

      const subscription = await deps.repository.getLatestSubscriptionByUserId(userId)
      const planTierFallback = subscription?.plan_tier ?? null

      const listed = await deps.stripe.invoices.list({
        customer: customerId,
        limit: 24,
        status: 'paid',
      })

      const invoices = listed.data.map((invoice) => {
        const lineDescriptions = (invoice.lines?.data ?? []).map((line) => {
          if (line.description?.trim()) return line.description.trim()
          const price = line.price
          if (price && typeof price === 'object' && price.product) {
            const product = price.product
            if (typeof product === 'object' && product && 'name' in product && typeof product.name === 'string') {
              return product.name
            }
          }
          return ''
        })

        return mapStripeInvoice({
          id: invoice.id,
          number: invoice.number,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          invoicePdf: invoice.invoice_pdf ?? null,
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
          lineDescriptions,
          planTierFallback,
        })
      })

      return { invoices }
    },

    /**
     * Opens Stripe Customer Portal in payment-method-update flow only.
     * Intentionally avoids the portal home (cancel subscription / plan changes).
     */
    async createBillingPortalSession(userId: string): Promise<{ url: string }> {
      const profile = await deps.repository.getProfileBillingFields(userId)
      const customerId = profile?.stripe_customer_id?.trim() ?? ''
      if (!customerId) {
        throw new Error('No Stripe customer on file. Add a payment method via checkout first.')
      }

      const baseUrl = deps.getAppBaseUrl().replace(/\/$/, '')
      const returnUrl = `${baseUrl}/app/account`
      const session = await deps.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        flow_data: {
          type: 'payment_method_update',
          after_completion: {
            type: 'redirect',
            redirect: { return_url: returnUrl },
          },
        },
      })
      if (!session.url) {
        throw new Error('Stripe billing portal session missing url')
      }
      return { url: session.url }
    },

    async createCheckoutSession(
      userId: string,
      email: string | null,
      plan: CheckoutPlanId,
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

      const recurringPriceId = priceIdForCheckoutPlan(env.priceIds, plan)

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
        cancel_url: `${baseUrl}/checkout?plan=${plan}&checkout=cancel`,
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
          const planHint = storedPlanTierFromMetadata(session.metadata?.plan)
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id
          if (subscriptionId) {
            const subscription = await deps.stripe.subscriptions.retrieve(subscriptionId)
            await syncSubscription(userId, subscription, planHint)
          }
          await capturePostHogEvent({
            distinctId: userId,
            event: 'subscription_completed',
            properties: {
              plan: planHint ?? session.metadata?.plan ?? null,
              stripe_event_type: event.type,
              include_law_hub: session.metadata?.include_lawhub !== 'false',
            },
          })
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
          const planHint = storedPlanTierFromMetadata(subscription.metadata?.plan)
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
          const planHint = storedPlanTierFromMetadata(subscription.metadata?.plan)
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
