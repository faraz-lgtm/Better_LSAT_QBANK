import { assertEquals } from 'jsr:@std/assert@1'
import { handleNotifySignupMailerlite } from './notify-signup-mailerlite.controller.ts'

const insertBody = {
  type: 'INSERT',
  schema: 'auth',
  table: 'users',
  record: {
    id: 'user-1',
    email: 'new@example.com',
    created_at: '2026-10-08T12:00:00Z',
    raw_app_meta_data: { provider: 'google' },
  },
  old_record: null,
}

Deno.test('handleNotifySignupMailerlite rejects unauthorized', async () => {
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify(insertBody),
    }),
    { authorize: () => false },
  )
  assertEquals(res.status, 401)
})

Deno.test('handleNotifySignupMailerlite syncs on auth.users INSERT', async () => {
  let syncedEmail = ''
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insertBody),
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

Deno.test('handleNotifySignupMailerlite ignores non-signup payloads', async () => {
  let notifyCalled = false
  const res = await handleNotifySignupMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'UPDATE',
        schema: 'auth',
        table: 'users',
        record: { id: 'user-1', email: 'a@b.com' },
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
