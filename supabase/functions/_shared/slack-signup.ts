export type SlackSignupNotifyInput = {
  email: string
  userId?: string
  provider?: string
  createdAt?: string
  /** First-touch landing URL (may include UTMs). */
  landingPage?: string | null
  /** Pre-formatted UTM summary, or null/empty to show unknown. */
  utms?: string | null
  /** Free / Paid (plan) intent label. */
  intent?: string | null
  /** ISO country code. */
  country?: string | null

  fetchImpl?: typeof fetch
  getEnv?: (key: string) => string | undefined
}

export type AuthUsersWebhookPayload = {
  type: string
  table: string
  schema: string
  record: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

export type ParsedSignupInsert = {
  email: string
  userId: string
  provider: string
  createdAt: string | null
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  monthly: 'Paid (monthly)',
  three_month: 'Paid (3 months)',
  six_month: 'Paid (6 months)',
  yearly: 'Paid (yearly)',
}

/** Maps checkout plan id → Slack intent line. Defaults to Free. */
export function formatSignupIntent(plan: string | null | undefined): string {
  const key = typeof plan === 'string' ? plan.trim().toLowerCase() : ''
  if (!key) return 'Free'
  return PLAN_LABELS[key] ?? (key === 'free' ? 'Free' : `Paid (${key})`)
}

/** Compact UTM / click-id summary for Slack. */
export function formatSignupUtms(attr: Record<string, unknown> | null | undefined): string {
  if (!attr || typeof attr !== 'object') return 'unknown'
  const parts: string[] = []
  const pairs: Array<[string, string]> = [
    ['source', 'utm_source'],
    ['medium', 'utm_medium'],
    ['campaign', 'utm_campaign'],
    ['term', 'utm_term'],
    ['content', 'utm_content'],
    ['gclid', 'gclid'],
    ['fbclid', 'fbclid'],
  ]
  for (const [label, key] of pairs) {
    const value = attr[key]
    if (typeof value === 'string' && value.trim()) {
      parts.push(`${label}=${value.trim()}`)
    }
  }
  return parts.length > 0 ? parts.join(' · ') : 'unknown'
}

export function formatSignupLandingPage(attr: Record<string, unknown> | null | undefined): string {
  if (!attr || typeof attr !== 'object') return 'unknown'
  const landing = attr.landing_page
  if (typeof landing === 'string' && landing.trim()) return landing.trim()
  return 'unknown'
}

export function formatSignupCountry(country: string | null | undefined): string {
  const trimmed = typeof country === 'string' ? country.trim().toUpperCase() : ''
  if (!trimmed || trimmed === 'XX' || trimmed === 'T1') return 'unknown'
  return trimmed
}

/** Formats an ISO timestamp in America/Toronto for Slack (e.g. "Fri Oct 17, 2026 · 3:42 PM EDT"). */
export function formatSignupCreatedAtToronto(iso: string | null | undefined): string | null {
  const raw = typeof iso === 'string' ? iso.trim() : ''
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).formatToParts(date)

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? ''

    const weekday = get('weekday')
    const month = get('month')
    const day = get('day')
    const year = get('year')
    const hour = get('hour')
    const minute = get('minute')
    const dayPeriod = get('dayPeriod')
    const timeZoneName = get('timeZoneName')

    return `${weekday} ${month} ${day}, ${year} · ${hour}:${minute} ${dayPeriod} ${timeZoneName}`
  } catch {
    return raw
  }
}

export async function notifySlackSignup(input: SlackSignupNotifyInput): Promise<boolean> {
  const getEnv = input.getEnv ?? ((key: string) => Deno.env.get(key) ?? undefined)
  const webhookUrl = getEnv('SLACK_SIGNUP_WEBHOOK_URL')?.trim()
  const email = input.email.trim()
  if (!webhookUrl || !email) return false

  const fetchImpl = input.fetchImpl ?? fetch
  const created = formatSignupCreatedAtToronto(input.createdAt)
  const lines = [
    '🎉 *New LSAT signup*',
    '',
    `• *Email:* \`${email}\``,
    `• *Intent:* ${input.intent?.trim() || 'Free'}`,
    `• *Location:* ${formatSignupCountry(input.country)}`,
    `• *Provider:* ${input.provider?.trim() || 'unknown'}`,
    `• *Link:* ${input.landingPage?.trim() || 'unknown'}`,
    `• *UTMs:* ${input.utms?.trim() || 'unknown'}`,
  ]
  if (created) lines.push(`• *Created:* ${created} (Toronto)`)
  if (input.userId?.trim()) lines.push(`• *User ID:* \`${input.userId.trim()}\``)

  try {
    const response = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })
    return response.ok
  } catch (error) {
    console.warn('Slack signup notify failed:', error)
    return false
  }
}

export function authorizeSignupWebhook(
  req: Request,
  getEnv: (key: string) => string | undefined = (key) => Deno.env.get(key) ?? undefined,
): boolean {
  const expected = getEnv('SIGNUP_WEBHOOK_SECRET')?.trim()
  if (!expected) return false

  const headerSecret = req.headers.get('x-signup-webhook-secret')?.trim()
  if (headerSecret && headerSecret === expected) return true

  const auth = req.headers.get('Authorization')?.trim() ?? ''
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  return Boolean(bearer && bearer === expected)
}

function readProvider(record: Record<string, unknown>): string {
  const appMeta = record.raw_app_meta_data
  if (appMeta && typeof appMeta === 'object' && !Array.isArray(appMeta)) {
    const provider = (appMeta as Record<string, unknown>).provider
    if (typeof provider === 'string' && provider.trim()) return provider.trim()
    const providers = (appMeta as Record<string, unknown>).providers
    if (Array.isArray(providers) && typeof providers[0] === 'string' && providers[0].trim()) {
      return providers[0].trim()
    }
  }
  return 'unknown'
}

function readConfirmedAt(record: Record<string, unknown> | null | undefined): string | null {
  if (!record || typeof record !== 'object') return null
  const value = record.email_confirmed_at
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function isEmailConfirmationEvent(payload: AuthUsersWebhookPayload): boolean {
  const confirmedAt = readConfirmedAt(payload.record)
  if (!confirmedAt) return false

  if (payload.type === 'INSERT') {
    // OAuth / confirmations-off: user is already verified on insert.
    return true
  }

  if (payload.type === 'UPDATE') {
    // Email/password: notify only when confirmation flips null → set.
    return readConfirmedAt(payload.old_record) === null
  }

  return false
}

function parseAuthUsersRecord(body: unknown): ParsedSignupInsert | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const payload = body as AuthUsersWebhookPayload
  if (payload.table !== 'users') return null
  if (payload.schema !== 'auth') return null
  if (!payload.record || typeof payload.record !== 'object') return null

  const record = payload.record
  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : ''
  const userId = typeof record.id === 'string' ? record.id.trim() : ''
  if (!email || !userId) return null

  const createdAt =
    typeof record.created_at === 'string' && record.created_at.trim()
      ? record.created_at.trim()
      : null

  return {
    email,
    userId,
    provider: readProvider(record),
    createdAt,
  }
}

/**
 * Parses auth.users Database Webhook payloads for confirmed signups only.
 * - INSERT: email_confirmed_at already set (OAuth / auto-confirm)
 * - UPDATE: email_confirmed_at newly set (email magic-link / confirm click)
 */
export function parseAuthUsersConfirmedSignup(body: unknown): ParsedSignupInsert | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const payload = body as AuthUsersWebhookPayload
  if (!isEmailConfirmationEvent(payload)) return null
  return parseAuthUsersRecord(body)
}

/**
 * Parses auth.users Database Webhook payloads for account creation (INSERT only).
 * Syncs immediately — does not wait for email confirmation.
 */
export function parseAuthUsersSignupCreated(body: unknown): ParsedSignupInsert | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const payload = body as AuthUsersWebhookPayload
  if (payload.type !== 'INSERT') return null
  return parseAuthUsersRecord(body)
}
