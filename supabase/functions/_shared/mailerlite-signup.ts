import type { CheckoutPlanId } from './stripe-env.ts'

export type MailerLiteSignupNotifyInput = {
  email: string
  /** When set, overrides default signup field defaults (done=false, type empty). */
  diagnosticDone?: boolean
  diagnosticType?: MailerLiteDiagnosticType | null
  /** Scaled LSAT diagnostic score (typically 120–180). */
  diagnosticScore?: number | null
  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}

export type MailerLiteDiagnosticType = 'mini' | 'full'
export type MailerLiteSubscriptionStatus = 'free' | 'paid'

export type MailerLiteUpsertSubscriberInput = {
  email: string
  fields: Record<string, string | number | null>
  /** When true, also assign signup groups. Default false for field-only updates. */
  assignGroups?: boolean
  /** When assignGroups is true and this is true, also add the diagnostic-done group. */
  diagnosticDone?: boolean
  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}

const MAILERLITE_SUBSCRIBERS_URL = 'https://connect.mailerlite.com/api/subscribers'

/** Always assigned on signup (in addition to MAILERLITE_USERS_GROUP_ID when set). */
export const MAILERLITE_SIGNUP_GROUP_ID = '201418391386326159'

/** Assigned when the subscriber has completed a diagnostic (in addition to signup groups). */
export const MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID = '201418422278423939'

/** Custom field keys — create matching fields in MailerLite (Text unless noted). */
export const MAILERLITE_FIELD_EMAIL = 'email'
export const MAILERLITE_FIELD_DIAGNOSTIC_DONE = 'diagnostic_done'
export const MAILERLITE_FIELD_DIAGNOSTIC_TYPE = 'diagnostic_type'
/** Scaled / final diagnostic LSAT score — MailerLite Number field. */
export const MAILERLITE_FIELD_DIAGNOSTIC_SCORE = 'diagnostic_score'
export const MAILERLITE_FIELD_SUBSCRIPTION_STATUS = 'subscription_status'
export const MAILERLITE_FIELD_SUBSCRIPTION_PACKAGE = 'subscription_package'

/** Pricing-page package labels (match guest-pricing-plans-data / BILLING_PLAN_CATALOG). */
export const MAILERLITE_PACKAGE_FREE = 'Free Access'
export const MAILERLITE_PACKAGE_FULL_ACCESS_FALLBACK = 'Full Access'

const CHECKOUT_PLAN_PACKAGE_LABELS: Record<CheckoutPlanId, string> = {
  monthly: 'Monthly',
  three_month: '3 Months',
  six_month: '6 Months',
  yearly: '12 Months',
}

export type ResolveMailerLiteSignupGroupIdsOptions = {
  /** When true, also include MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID. */
  diagnosticDone?: boolean
}

/** Resolves MailerLite group IDs for a new signup: configured Users group + signup group. */
export function resolveMailerLiteSignupGroupIds(
  getEnv: (key: string) => string | undefined,
  options?: ResolveMailerLiteSignupGroupIdsOptions,
): string[] {
  const ids = new Set<string>()
  const configured = getEnv('MAILERLITE_USERS_GROUP_ID')?.trim()
  if (configured) ids.add(configured)
  ids.add(MAILERLITE_SIGNUP_GROUP_ID)
  if (options?.diagnosticDone === true) ids.add(MAILERLITE_DIAGNOSTIC_DONE_GROUP_ID)
  return [...ids]
}

/** Maps product intent (`mini` | `quick` | `full`) to MailerLite diagnostic_type. */
export function mailerLiteDiagnosticTypeFromIntent(
  intentId: string | null | undefined,
): MailerLiteDiagnosticType | null {
  const id = intentId?.trim().toLowerCase() ?? ''
  if (id === 'mini') return 'mini'
  if (id === 'quick' || id === 'full') return 'full'
  return null
}

/**
 * Normalizes a scaled diagnostic score for MailerLite.
 * Accepts numbers or numeric strings; returns a rounded integer or null.
 */
export function normalizeMailerLiteDiagnosticScore(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(n)
}

/** Pricing-page package name for MailerLite (`Free Access`, `Monthly`, `3 Months`, …). */
export function mailerLitePackageFromCheckoutPlan(
  plan: CheckoutPlanId | null | undefined,
  isPaid: boolean,
): string {
  if (!isPaid) return MAILERLITE_PACKAGE_FREE
  if (!plan) return MAILERLITE_PACKAGE_FULL_ACCESS_FALLBACK
  return CHECKOUT_PLAN_PACKAGE_LABELS[plan]
}

/**
 * Builds MailerLite `fields` for a subscriber.
 * Only includes diagnostic/subscription keys when those sections are provided
 * (omitted keys are left unchanged on upsert).
 */
export function buildMailerLiteSubscriberFields(input: {
  email: string
  diagnostic?: {
    done: boolean
    type: MailerLiteDiagnosticType | null
    /**
     * Scaled / final diagnostic score.
     * `undefined` = omit field (leave unchanged on upsert).
     * `null` / non-finite = clear field when diagnostic section is sent.
     */
    score?: number | null
  }
  subscription?: {
    status: MailerLiteSubscriptionStatus
    package: string
  }
}): Record<string, string | number | null> {
  const email = input.email.trim()
  const fields: Record<string, string | number | null> = {
    [MAILERLITE_FIELD_EMAIL]: email,
  }
  if (input.diagnostic) {
    const done = input.diagnostic.done === true
    fields[MAILERLITE_FIELD_DIAGNOSTIC_DONE] = done ? 'yes' : 'no'
    fields[MAILERLITE_FIELD_DIAGNOSTIC_TYPE] =
      done && input.diagnostic.type ? input.diagnostic.type : ''
    if (input.diagnostic.score !== undefined) {
      const score = normalizeMailerLiteDiagnosticScore(input.diagnostic.score)
      // Number custom field: send integer when known, null to clear.
      fields[MAILERLITE_FIELD_DIAGNOSTIC_SCORE] = done && score != null ? score : null
    }
  }
  if (input.subscription) {
    fields[MAILERLITE_FIELD_SUBSCRIPTION_STATUS] = input.subscription.status
    fields[MAILERLITE_FIELD_SUBSCRIPTION_PACKAGE] = input.subscription.package
  }
  return fields
}

/** Upserts a MailerLite subscriber with fields (and optional groups). Never throws. */
export async function upsertMailerLiteSubscriber(
  input: MailerLiteUpsertSubscriberInput,
): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const apiToken = getEnv('MAILERLITE_API_TOKEN')?.trim()
  const email = input.email.trim()
  if (!apiToken || !email) return false

  const body: Record<string, unknown> = {
    email,
    fields: input.fields,
  }
  if (input.assignGroups) {
    body.groups = resolveMailerLiteSignupGroupIds(getEnv, {
      diagnosticDone: input.diagnosticDone === true,
    })
  }

  const fetchImpl = input.fetchImpl ?? fetch
  try {
    const response = await fetchImpl(MAILERLITE_SUBSCRIBERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    return response.ok
  } catch (error) {
    console.warn('MailerLite subscriber upsert failed:', error)
    return false
  }
}

/** Upserts a signup email into MailerLite with fields + signup group(s). Never throws. */
export async function notifyMailerLiteSignup(input: MailerLiteSignupNotifyInput): Promise<boolean> {
  const email = input.email.trim()
  const diagnosticDone = input.diagnosticDone === true
  return await upsertMailerLiteSubscriber({
    email,
    fields: buildMailerLiteSubscriberFields({
      email,
      diagnostic: {
        done: diagnosticDone,
        type: input.diagnosticType ?? null,
        score: input.diagnosticScore !== undefined
          ? normalizeMailerLiteDiagnosticScore(input.diagnosticScore)
          : undefined,
      },
      subscription: {
        status: 'free',
        package: MAILERLITE_PACKAGE_FREE,
      },
    }),
    assignGroups: true,
    diagnosticDone,
    fetchImpl: input.fetchImpl,
    getEnv: input.getEnv,
  })
}

/**
 * Updates MailerLite diagnostic custom fields (done, type, scaled score).
 * When diagnosticDone is true, also assigns signup groups + diagnostic-done group.
 * Never throws.
 */
export async function notifyMailerLiteDiagnostic(input: {
  email: string
  diagnosticDone: boolean
  diagnosticType: MailerLiteDiagnosticType | null
  /** Scaled / final diagnostic score. Omit to leave unchanged. */
  diagnosticScore?: number | null
  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}): Promise<boolean> {
  const email = input.email.trim()
  const diagnosticDone = input.diagnosticDone === true
  return await upsertMailerLiteSubscriber({
    email,
    fields: buildMailerLiteSubscriberFields({
      email,
      diagnostic: {
        done: diagnosticDone,
        type: input.diagnosticType,
        score: input.diagnosticScore !== undefined
          ? normalizeMailerLiteDiagnosticScore(input.diagnosticScore)
          : undefined,
      },
    }),
    // Guest → signup → onboarding sync: assign diagnostic-done group (and signup groups) as well.
    assignGroups: diagnosticDone,
    diagnosticDone,
    fetchImpl: input.fetchImpl,
    getEnv: input.getEnv,
  })
}

/** Updates MailerLite subscription status/package fields only. Never throws. */
export async function notifyMailerLiteSubscription(input: {
  email: string
  subscriptionStatus: MailerLiteSubscriptionStatus
  subscriptionPackage: string
  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}): Promise<boolean> {
  const email = input.email.trim()
  return await upsertMailerLiteSubscriber({
    email,
    fields: buildMailerLiteSubscriberFields({
      email,
      subscription: {
        status: input.subscriptionStatus,
        package: input.subscriptionPackage,
      },
    }),
    assignGroups: false,
    fetchImpl: input.fetchImpl,
    getEnv: input.getEnv,
  })
}
