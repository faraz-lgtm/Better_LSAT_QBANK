import { assertEquals } from 'jsr:@std/assert@1'
import {
  authorizeSignupWebhook,
  formatSignupCountry,
  formatSignupCreatedAtToronto,
  formatSignupIntent,
  formatSignupLandingPage,
  formatSignupUtms,
  notifySlackSignup,
  parseAuthUsersConfirmedSignup,
} from './slack-signup.ts'

Deno.test('notifySlackSignup no-ops when webhook URL missing', async () => {
  let called = false
  const ok = await notifySlackSignup({
    email: 'a@example.com',
    getEnv: () => undefined,
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('notifySlackSignup posts Slack message with enrichment fields', async () => {
  let url = ''
  let body: Record<string, unknown> = {}
  const ok = await notifySlackSignup({
    email: 'student@example.com',
    userId: 'u-1',
    provider: 'email',
    createdAt: '2026-10-08T10:00:00Z',
    landingPage: 'https://app.betterlsat.com/signup?utm_source=google&plan=monthly',
    utms: 'source=google · medium=cpc',
    intent: 'Paid (monthly)',
    country: 'US',
    getEnv: (key) => (key === 'SLACK_SIGNUP_WEBHOOK_URL' ? 'https://hooks.slack.com/services/x' : undefined),
    fetchImpl: async (input, init) => {
      url = String(input)
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<string, unknown>
      return new Response('ok', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(url, 'https://hooks.slack.com/services/x')
  const text = String(body.text ?? '')
  assertEquals(text.includes('student@example.com'), true)
  assertEquals(text.includes('email'), true)
  assertEquals(text.includes('u-1'), true)
  assertEquals(text.includes('*Link:* https://app.betterlsat.com/signup?utm_source=google&plan=monthly'), true)
  assertEquals(text.includes('*UTMs:* source=google · medium=cpc'), true)
  assertEquals(text.includes('*Intent:* Paid (monthly)'), true)
  assertEquals(text.includes('*Location:* US'), true)
  assertEquals(text.includes('(Toronto)'), true)
  assertEquals(text.includes('2026-10-08T10:00:00Z'), false)
})

Deno.test('notifySlackSignup degrades missing enrichment fields', async () => {
  let body: Record<string, unknown> = {}
  await notifySlackSignup({
    email: 'a@example.com',
    getEnv: (key) => (key === 'SLACK_SIGNUP_WEBHOOK_URL' ? 'https://hooks.slack.com/services/x' : undefined),
    fetchImpl: async (_input, init) => {
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<string, unknown>
      return new Response('ok', { status: 200 })
    },
  })
  const text = String(body.text ?? '')
  assertEquals(text.includes('*Link:* unknown'), true)
  assertEquals(text.includes('*UTMs:* unknown'), true)
  assertEquals(text.includes('*Intent:* Free'), true)
  assertEquals(text.includes('*Location:* unknown'), true)
})

Deno.test('formatSignupCreatedAtToronto formats America/Toronto time', () => {
  const formatted = formatSignupCreatedAtToronto('2026-10-08T16:00:00.000Z')
  assertEquals(typeof formatted, 'string')
  assertEquals(Boolean(formatted && formatted.includes('2026')), true)
  assertEquals(Boolean(formatted && (formatted.includes('EDT') || formatted.includes('EST'))), true)
  assertEquals(formatSignupCreatedAtToronto(null), null)
  assertEquals(formatSignupCreatedAtToronto('not-a-date'), 'not-a-date')
})

Deno.test('notifySlackSignup returns false on fetch failure', async () => {
  const ok = await notifySlackSignup({
    email: 'a@example.com',
    getEnv: (key) => (key === 'SLACK_SIGNUP_WEBHOOK_URL' ? 'https://hooks.slack.com/services/x' : undefined),
    fetchImpl: async () => {
      throw new Error('network')
    },
  })
  assertEquals(ok, false)
})

Deno.test('formatSignupIntent maps plan ids', () => {
  assertEquals(formatSignupIntent('free'), 'Free')
  assertEquals(formatSignupIntent('monthly'), 'Paid (monthly)')
  assertEquals(formatSignupIntent('three_month'), 'Paid (3 months)')
  assertEquals(formatSignupIntent(null), 'Free')
  assertEquals(formatSignupIntent('custom_plan'), 'Paid (custom_plan)')
})

Deno.test('formatSignupUtms and landing page helpers', () => {
  assertEquals(formatSignupUtms(null), 'unknown')
  assertEquals(
    formatSignupUtms({ utm_source: 'google', utm_medium: 'cpc', gclid: 'g1' }),
    'source=google · medium=cpc · gclid=g1',
  )
  assertEquals(formatSignupLandingPage(null), 'unknown')
  assertEquals(
    formatSignupLandingPage({ landing_page: 'https://app.betterlsat.com/signup' }),
    'https://app.betterlsat.com/signup',
  )
  assertEquals(formatSignupCountry('us'), 'US')
  assertEquals(formatSignupCountry('XX'), 'unknown')
  assertEquals(formatSignupCountry(null), 'unknown')
})

Deno.test('authorizeSignupWebhook accepts x-signup-webhook-secret', () => {
  const req = new Request('https://example.com', {
    headers: { 'x-signup-webhook-secret': 'sekrit' },
  })
  assertEquals(
    authorizeSignupWebhook(req, (key) => (key === 'SIGNUP_WEBHOOK_SECRET' ? 'sekrit' : undefined)),
    true,
  )
})

Deno.test('authorizeSignupWebhook accepts Bearer token', () => {
  const req = new Request('https://example.com', {
    headers: { Authorization: 'Bearer sekrit' },
  })
  assertEquals(
    authorizeSignupWebhook(req, (key) => (key === 'SIGNUP_WEBHOOK_SECRET' ? 'sekrit' : undefined)),
    true,
  )
})

Deno.test('authorizeSignupWebhook rejects missing/wrong secret', () => {
  assertEquals(
    authorizeSignupWebhook(new Request('https://example.com'), () => undefined),
    false,
  )
  const req = new Request('https://example.com', {
    headers: { 'x-signup-webhook-secret': 'wrong' },
  })
  assertEquals(
    authorizeSignupWebhook(req, (key) => (key === 'SIGNUP_WEBHOOK_SECRET' ? 'sekrit' : undefined)),
    false,
  )
})

Deno.test('parseAuthUsersConfirmedSignup accepts INSERT when already confirmed', () => {
  const parsed = parseAuthUsersConfirmedSignup({
    type: 'INSERT',
    schema: 'auth',
    table: 'users',
    record: {
      id: 'user-1',
      email: 'Student@Example.com',
      created_at: '2026-10-08T10:00:00Z',
      email_confirmed_at: '2026-10-08T10:00:01Z',
      raw_app_meta_data: { provider: 'google', providers: ['google'] },
    },
    old_record: null,
  })
  assertEquals(parsed, {
    email: 'student@example.com',
    userId: 'user-1',
    provider: 'google',
    createdAt: '2026-10-08T10:00:00Z',
  })
})

Deno.test('parseAuthUsersConfirmedSignup ignores INSERT before email confirm', () => {
  assertEquals(
    parseAuthUsersConfirmedSignup({
      type: 'INSERT',
      schema: 'auth',
      table: 'users',
      record: {
        id: 'user-1',
        email: 'student@example.com',
        created_at: '2026-10-08T10:00:00Z',
        email_confirmed_at: null,
        raw_app_meta_data: { provider: 'email' },
      },
      old_record: null,
    }),
    null,
  )
})

Deno.test('parseAuthUsersConfirmedSignup accepts UPDATE when email newly confirmed', () => {
  const parsed = parseAuthUsersConfirmedSignup({
    type: 'UPDATE',
    schema: 'auth',
    table: 'users',
    record: {
      id: 'user-1',
      email: 'Student@Example.com',
      created_at: '2026-10-08T10:00:00Z',
      email_confirmed_at: '2026-10-08T10:05:00Z',
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
    },
    old_record: {
      id: 'user-1',
      email: 'Student@Example.com',
      email_confirmed_at: null,
    },
  })
  assertEquals(parsed, {
    email: 'student@example.com',
    userId: 'user-1',
    provider: 'email',
    createdAt: '2026-10-08T10:00:00Z',
  })
})

Deno.test('parseAuthUsersConfirmedSignup ignores UPDATE when already confirmed', () => {
  assertEquals(
    parseAuthUsersConfirmedSignup({
      type: 'UPDATE',
      schema: 'auth',
      table: 'users',
      record: {
        id: 'user-1',
        email: 'a@b.com',
        email_confirmed_at: '2026-10-08T10:05:00Z',
      },
      old_record: {
        id: 'user-1',
        email: 'a@b.com',
        email_confirmed_at: '2026-10-08T10:00:00Z',
      },
    }),
    null,
  )
})

Deno.test('parseAuthUsersConfirmedSignup ignores non-auth.users payloads', () => {
  assertEquals(
    parseAuthUsersConfirmedSignup({
      type: 'INSERT',
      schema: 'public',
      table: 'profiles',
      record: { id: 'u', email: 'a@b.com', email_confirmed_at: '2026-10-08T10:00:00Z' },
    }),
    null,
  )
  assertEquals(
    parseAuthUsersConfirmedSignup({
      type: 'INSERT',
      schema: 'auth',
      table: 'users',
      record: { id: 'u', email_confirmed_at: '2026-10-08T10:00:00Z' },
    }),
    null,
  )
})
