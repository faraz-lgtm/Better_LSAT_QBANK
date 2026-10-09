import { assertEquals } from 'jsr:@std/assert@1'
import { notifyMailerLiteSignup } from './mailerlite-signup.ts'

Deno.test('notifyMailerLiteSignup no-ops when API token missing', async () => {
  let called = false
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => (key === 'MAILERLITE_USERS_GROUP_ID' ? '200747565208044623' : undefined),
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('notifyMailerLiteSignup no-ops when group ID missing', async () => {
  let called = false
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => (key === 'MAILERLITE_API_TOKEN' ? 'token' : undefined),
    fetchImpl: async () => {
      called = true
      return new Response('ok')
    },
  })
  assertEquals(ok, false)
  assertEquals(called, false)
})

Deno.test('notifyMailerLiteSignup posts subscriber upsert with group', async () => {
  let url = ''
  let method = ''
  let auth = ''
  let body: Record<string, unknown> = {}
  const ok = await notifyMailerLiteSignup({
    email: 'student@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async (input, init) => {
      url = String(input)
      method = (init as { method?: string } | undefined)?.method ?? ''
      const headers = (init as { headers?: Record<string, string> } | undefined)?.headers ?? {}
      auth = headers.Authorization ?? ''
      body = JSON.parse((init as { body?: string } | undefined)?.body ?? '{}') as Record<string, unknown>
      return new Response('{}', { status: 200 })
    },
  })
  assertEquals(ok, true)
  assertEquals(url, 'https://connect.mailerlite.com/api/subscribers')
  assertEquals(method, 'POST')
  assertEquals(auth, 'Bearer ml-token')
  assertEquals(body.email, 'student@example.com')
  assertEquals(body.groups, ['200747565208044623'])
})

Deno.test('notifyMailerLiteSignup returns false on non-OK response', async () => {
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async () => new Response('error', { status: 422 }),
  })
  assertEquals(ok, false)
})

Deno.test('notifyMailerLiteSignup returns false on fetch failure', async () => {
  const ok = await notifyMailerLiteSignup({
    email: 'a@example.com',
    getEnv: (key) => {
      if (key === 'MAILERLITE_API_TOKEN') return 'ml-token'
      if (key === 'MAILERLITE_USERS_GROUP_ID') return '200747565208044623'
      return undefined
    },
    fetchImpl: async () => {
      throw new Error('network')
    },
  })
  assertEquals(ok, false)
})
