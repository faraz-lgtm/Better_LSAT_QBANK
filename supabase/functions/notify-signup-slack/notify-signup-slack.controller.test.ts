import { assertEquals } from 'jsr:@std/assert@1'
import { handleNotifySignupSlack } from './notify-signup-slack.controller.ts'

const confirmedInsertBody = {
  type: 'INSERT',
  schema: 'auth',
  table: 'users',
  record: {
    id: 'user-1',
    email: 'new@example.com',
    created_at: '2026-10-08T12:00:00Z',
    email_confirmed_at: '2026-10-08T12:00:01Z',
    raw_app_meta_data: { provider: 'google' },
  },
  old_record: null,
}

const confirmUpdateBody = {
  type: 'UPDATE',
  schema: 'auth',
  table: 'users',
  record: {
    id: 'user-2',
    email: 'confirm@example.com',
    created_at: '2026-10-08T11:00:00Z',
    email_confirmed_at: '2026-10-08T11:05:00Z',
    raw_app_meta_data: { provider: 'email' },
  },
  old_record: {
    id: 'user-2',
    email: 'confirm@example.com',
    email_confirmed_at: null,
  },
}

Deno.test('handleNotifySignupSlack rejects unauthorized', async () => {
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify(confirmedInsertBody),
    }),
    { authorize: () => false },
  )
  assertEquals(res.status, 401)
})

Deno.test('handleNotifySignupSlack no longer notifies on confirmed INSERT', async () => {
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmedInsertBody),
    }),
    { authorize: () => true },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { received: boolean; notified: boolean; reason?: string }
  assertEquals(data.received, true)
  assertEquals(data.notified, false)
  assertEquals(data.reason, 'moved_to_conversion')
})

Deno.test('handleNotifySignupSlack no longer notifies on email confirmation UPDATE', async () => {
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmUpdateBody),
    }),
    { authorize: () => true },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { received: boolean; notified: boolean; reason?: string }
  assertEquals(data.received, true)
  assertEquals(data.notified, false)
  assertEquals(data.reason, 'moved_to_conversion')
})

Deno.test('handleNotifySignupSlack ignores unconfirmed INSERT', async () => {
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'INSERT',
        schema: 'auth',
        table: 'users',
        record: {
          id: 'user-1',
          email: 'a@b.com',
          email_confirmed_at: null,
        },
      }),
    }),
    { authorize: () => true },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { notified: boolean; reason?: string }
  assertEquals(data.notified, false)
  assertEquals(data.reason, 'ignored')
})

Deno.test('handleNotifySignupSlack rejects non-POST', async () => {
  const res = await handleNotifySignupSlack(new Request('https://example.com', { method: 'GET' }), {
    authorize: () => true,
  })
  assertEquals(res.status, 405)
})
