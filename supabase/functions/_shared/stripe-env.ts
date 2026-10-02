export type PrepPlusSource = 'vendor_subscription' | 'existing_lsac'

/** Stored on billing_subscriptions.plan_tier. New Core intervals all persist as core. */
export type BillingPlanId = 'core' | 'live'

/** Checkout selection. All three are prices on the Core product. */
export type CheckoutPlanId = 'monthly' | 'three_month' | 'six_month'

export type StripePriceIds = {
  monthly: string
  threeMonth: string
  sixMonth: string
  lsacYearly: string
  /** Legacy Live price. Still mapped so existing subscriptions keep plan_tier live. */
  live?: string
}

export type StripeRuntimeEnv = {
  secretKey: string
  webhookSecret: string
  priceIds: StripePriceIds
  publishableKey: string
  liveMode: boolean
}

export type BillingCatalogPlan = {
  id: CheckoutPlanId
  name: string
  headline: string
  description: string
  priceUsd: number
  equivalentMonthlyUsd: number | null
  discountLabel: string | null
  badge: string | null
  intervalCount: 1 | 3 | 6
  renewalNote: string
}

/** Display amounts for pricing UI (actual charge amounts come from Stripe Prices). */
export const BILLING_PLAN_CATALOG = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    headline: 'Full Access. Stay Flexible.',
    description: 'Get every BetterLSAT tool month to month with no long commitment.',
    priceUsd: 69,
    equivalentMonthlyUsd: null,
    discountLabel: null,
    badge: null,
    intervalCount: 1,
    renewalNote: 'Renews at $69 every month. Cancel anytime.',
  },
  threeMonth: {
    id: 'three_month',
    name: '3 Months',
    headline: 'A Focused 3-Month Prep Plan.',
    description: 'Full platform access for a defined prep window—with a lower monthly equivalent.',
    priceUsd: 192,
    equivalentMonthlyUsd: 64,
    discountLabel: '7% Ongoing Discount',
    badge: 'Most Popular',
    intervalCount: 3,
    renewalNote: 'Renews at $192 every 3 months.',
  },
  sixMonth: {
    id: 'six_month',
    name: '6 Months',
    headline: 'More Time. Better Monthly Value.',
    description: 'Give yourself more runway while lowering the monthly equivalent.',
    priceUsd: 354,
    equivalentMonthlyUsd: 59,
    discountLabel: '15% Ongoing Discount',
    badge: null,
    intervalCount: 6,
    renewalNote: 'Renews at $354 every 6 months.',
  },
  lsacYearly: {
    name: 'LawHub Advantage',
    description: 'Official LSAT PrepPlus via LawHub. Fee goes to LSAC, not Better LSAT. First year billed once at checkout.',
    yearlyUsd: 99,
  },
} as const satisfies {
  monthly: BillingCatalogPlan
  threeMonth: BillingCatalogPlan
  sixMonth: BillingCatalogPlan
  lsacYearly: { name: string; description: string; yearlyUsd: number }
}

export const CHECKOUT_PLANS = [
  BILLING_PLAN_CATALOG.monthly,
  BILLING_PLAN_CATALOG.threeMonth,
  BILLING_PLAN_CATALOG.sixMonth,
] as const

function readLiveModeFlag(raw: Record<string, string | undefined>): boolean {
  const value = raw.STRIPE_LIVE_MODE ?? raw.StripeLiveMode
  if (value == null || value === '') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

/** Local Supabase edge always uses test Stripe keys. */
export function isLocalSupabaseHost(supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false
  try {
    const host = new URL(supabaseUrl).hostname
    return host === '127.0.0.1' || host === 'localhost' || host === 'kong'
  } catch {
    return false
  }
}

export function resolveStripeLiveMode(raw: Record<string, string | undefined>): boolean {
  if (isLocalSupabaseHost(raw.SUPABASE_URL)) return false
  return readLiveModeFlag(raw)
}

function readPrice(raw: Record<string, string | undefined>, key: string): string | undefined {
  const value = raw[key]?.trim()
  return value ? value : undefined
}

function resolvePriceIds(
  raw: Record<string, string | undefined>,
  liveMode: boolean,
): StripePriceIds | null {
  const legacy = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_LIVE')
    : readPrice(raw, 'STRIPE_PRICE_ID_TEST')
  const monthly = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_CORE_LIVE') ?? legacy
    : readPrice(raw, 'STRIPE_PRICE_ID_CORE_TEST') ?? legacy
  const threeMonth = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_CORE_3_MONTH_LIVE')
    : readPrice(raw, 'STRIPE_PRICE_ID_CORE_3_MONTH_TEST')
  const sixMonth = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_CORE_6_MONTH_LIVE')
    : readPrice(raw, 'STRIPE_PRICE_ID_CORE_6_MONTH_TEST')
  const lsacYearly = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_LSAC_YEARLY_LIVE')
    : readPrice(raw, 'STRIPE_PRICE_ID_LSAC_YEARLY_TEST')
  const live = liveMode
    ? readPrice(raw, 'STRIPE_PRICE_ID_LIVE_MONTHLY_LIVE')
    : readPrice(raw, 'STRIPE_PRICE_ID_LIVE_MONTHLY_TEST')

  if (!monthly || !threeMonth || !sixMonth || !lsacYearly) return null
  return {
    monthly,
    threeMonth,
    sixMonth,
    lsacYearly,
    ...(live ? { live } : {}),
  }
}

export function checkoutPlanFromId(plan: CheckoutPlanId): BillingCatalogPlan {
  if (plan === 'monthly') return BILLING_PLAN_CATALOG.monthly
  if (plan === 'three_month') return BILLING_PLAN_CATALOG.threeMonth
  return BILLING_PLAN_CATALOG.sixMonth
}

export function priceIdForCheckoutPlan(priceIds: StripePriceIds, plan: CheckoutPlanId): string {
  if (plan === 'monthly') return priceIds.monthly
  if (plan === 'three_month') return priceIds.threeMonth
  return priceIds.sixMonth
}

export function resolvePlanFromPriceId(
  priceIds: StripePriceIds,
  priceId: string,
): BillingPlanId | null {
  if (
    priceId === priceIds.monthly ||
    priceId === priceIds.threeMonth ||
    priceId === priceIds.sixMonth
  ) {
    return 'core'
  }
  if (priceIds.live && priceId === priceIds.live) return 'live'
  return null
}

/** Maps checkout metadata onto the stored plan tier. */
export function storedPlanTierFromMetadata(plan: string | undefined): BillingPlanId | null {
  if (plan === 'live') return 'live'
  if (
    plan === 'core' ||
    plan === 'monthly' ||
    plan === 'three_month' ||
    plan === 'six_month'
  ) {
    return 'core'
  }
  return null
}

/** Returns null when Stripe is not configured for the resolved mode. */
export function parseStripeEnv(
  raw: Record<string, string | undefined>,
): StripeRuntimeEnv | null {
  const liveMode = resolveStripeLiveMode(raw)
  const secretKey = liveMode
    ? raw.STRIPE_SECRET_KEY_LIVE?.trim()
    : raw.STRIPE_SECRET_KEY_TEST?.trim()
  const webhookSecret = liveMode
    ? raw.STRIPE_WEBHOOK_SECRET_LIVE?.trim()
    : raw.STRIPE_WEBHOOK_SECRET_TEST?.trim()
  const priceIds = resolvePriceIds(raw, liveMode)
  const publishableKey = liveMode
    ? raw.STRIPE_PUBLISHABLE_KEY_LIVE?.trim()
    : raw.STRIPE_PUBLISHABLE_KEY_TEST?.trim()

  if (!secretKey || !webhookSecret || !priceIds || !publishableKey) {
    return null
  }

  return {
    secretKey,
    webhookSecret,
    priceIds,
    publishableKey,
    liveMode,
  }
}
