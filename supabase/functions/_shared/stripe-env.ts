export type PrepPlusSource = 'vendor_subscription' | 'existing_lsac'

export type BillingPlanId = 'core' | 'live'

export type StripePriceIds = {
  core: string
  live: string
  lsacYearly: string
}

export type StripeRuntimeEnv = {
  secretKey: string
  webhookSecret: string
  priceIds: StripePriceIds
  publishableKey: string
  liveMode: boolean
}

/** Display amounts for pricing UI (actual charge amounts come from Stripe Prices). */
export const BILLING_PLAN_CATALOG = {
  core: {
    id: 'core' as const,
    name: 'Core',
    tagline: 'Everything you need to improve your score.',
    monthlyUsd: 70,
  },
  live: {
    id: 'live' as const,
    name: 'Live',
    tagline: 'For students who want live instruction.',
    monthlyUsd: 129,
    badge: 'Most Comprehensive',
  },
  lsacYearly: {
    name: 'LawHub Advantage',
    description: 'Official LSAT PrepPlus via LawHub. Fee goes to LSAC, not Better LSAT. First year billed once at checkout.',
    yearlyUsd: 99,
  },
} as const

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

function resolvePriceIds(
  raw: Record<string, string | undefined>,
  liveMode: boolean,
): StripePriceIds | null {
  const legacy = liveMode
    ? raw.STRIPE_PRICE_ID_LIVE?.trim()
    : raw.STRIPE_PRICE_ID_TEST?.trim()
  const core = (liveMode
    ? raw.STRIPE_PRICE_ID_CORE_LIVE ?? legacy
    : raw.STRIPE_PRICE_ID_CORE_TEST ?? legacy)?.trim()
  const live = (liveMode
    ? raw.STRIPE_PRICE_ID_LIVE_MONTHLY_LIVE
    : raw.STRIPE_PRICE_ID_LIVE_MONTHLY_TEST)?.trim()
  const lsacYearly = (liveMode
    ? raw.STRIPE_PRICE_ID_LSAC_YEARLY_LIVE
    : raw.STRIPE_PRICE_ID_LSAC_YEARLY_TEST)?.trim()

  if (!core || !live || !lsacYearly) return null
  return { core, live, lsacYearly }
}

export function resolvePlanFromPriceId(
  priceIds: StripePriceIds,
  priceId: string,
): BillingPlanId | null {
  if (priceId === priceIds.core) return 'core'
  if (priceId === priceIds.live) return 'live'
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
