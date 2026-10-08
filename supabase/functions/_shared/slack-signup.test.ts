import { assertEquals } from 'jsr:@std/assert@1'
import {
  authorizeSignupWebhook,
  notifySlackSignup,
  parseAuthUsersSignupInsert,
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

Deno.test('parseAuthUsersSignupInsert reads email signup', () => {
  const parsed = parseAuthUsersSignupInsert({
    type: 'INSERT',
    schema: 'auth',
    table: 'users',
    record: {
      id: 'user-1',
      email: 'Student@Example.com',
      created_at: '2026-10-08T10:00:00Z',
      raw_app_meta_data: { provider: 'email', providers: ['email'] },
    },
    old_record: null,
  })
  assertEquals(parsed, {
    email: 'student@example.com',
    userId: 'user-1',
    provider: 'email',
    createdAt: '2026-10-08T10:00:00Z',
  })
})

Deno.test('parseAuthUsersSignupInsert ignores non-insert or non-auth.users', () => {
  assertEquals(
    parseAuthUsersSignupInsert({
      type: 'UPDATE',
      schema: 'auth',
      table: 'users',
      record: { id: 'u', email: 'a@b.com' },
    }),
    null,
  )
  assertEquals(
    parseAuthUsersSignupInsert({
      type: 'INSERT',
      schema: 'public',
      table: 'profiles',
      record: { id: 'u', email: 'a@b.com' },
    }),
    null,
  )
  assertEquals(
    parseAuthUsersSignupInsert({
      type: 'INSERT',
      schema: 'auth',
      table: 'users',
      record: { id: 'u' },
    }),
    null,
  )
})
