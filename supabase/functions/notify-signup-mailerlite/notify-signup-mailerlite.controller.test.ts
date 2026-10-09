import { assertEquals } from 'jsr:@std/assert@1'
import { handleNotifySignupMailerlite } from './notify-signup-mailerlite.controller.ts'

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

Deno.test('handleNotifySignupMailerlite rejects unauthorized', async () => {
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify(confirmedInsertBody),
    }),
    { authorize: () => false },
  )
  assertEquals(res.status, 401)
})

Deno.test('handleNotifySignupMailerlite syncs on confirmed INSERT', async () => {
  let syncedEmail = ''
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmedInsertBody),
    }),
    {
      authorize: () => true,
      notify: async (input) => {
        syncedEmail = input.email
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { received: boolean; synced: boolean }
  assertEquals(data.received, true)
  assertEquals(data.synced, true)
  assertEquals(syncedEmail, 'new@example.com')
})

Deno.test('handleNotifySignupMailerlite syncs on email confirmation UPDATE', async () => {
  let syncedEmail = ''
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmUpdateBody),
    }),
    {
      authorize: () => true,
      notify: async (input) => {
        syncedEmail = input.email
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { received: boolean; synced: boolean }
  assertEquals(data.received, true)
  assertEquals(data.synced, true)
  assertEquals(syncedEmail, 'confirm@example.com')
})

Deno.test('handleNotifySignupMailerlite ignores unconfirmed INSERT', async () => {
  let notifyCalled = false
  const res = await handleNotifySignupMailerlite(
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
    {
      authorize: () => true,
      notify: async () => {
        notifyCalled = true
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { synced: boolean; reason?: string }
  assertEquals(data.synced, false)
  assertEquals(data.reason, 'ignored')
  assertEquals(notifyCalled, false)
})

Deno.test('handleNotifySignupMailerlite rejects non-POST', async () => {
  const res = await handleNotifySignupMailerlite(new Request('https://example.com', { method: 'GET' }), {
    authorize: () => true,
  })
  assertEquals(res.status, 405)
})
