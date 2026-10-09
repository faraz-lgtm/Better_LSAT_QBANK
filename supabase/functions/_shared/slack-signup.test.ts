import { assertEquals } from 'jsr:@std/assert@1'
import {
  authorizeSignupWebhook,
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

Deno.test('notifySlackSignup posts Slack message', async () => {
  let url = ''
  let body: Record<string, unknown> = {}
  const ok = await notifySlackSignup({
    email: 'student@example.com',
    userId: 'u-1',
    provider: 'email',
    createdAt: '2026-10-08T10:00:00Z',
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
