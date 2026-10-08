import { assertEquals } from 'jsr:@std/assert@1'
import { handleNotifySignupSlack } from './notify-signup-slack.controller.ts'

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

Deno.test('handleNotifySignupSlack rejects unauthorized', async () => {
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify(insertBody),
    }),
    { authorize: () => false },
  )
  assertEquals(res.status, 401)
})

Deno.test('handleNotifySignupSlack notifies on auth.users INSERT', async () => {
  let notifiedEmail = ''
  let notifiedProvider = ''
  const res = await handleNotifySignupSlack(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insertBody),
    }),
    {
      authorize: () => true,
      notify: async (input) => {
        notifiedEmail = input.email
        notifiedProvider = input.provider ?? ''
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { received: boolean; notified: boolean }
  assertEquals(data.received, true)
  assertEquals(data.notified, true)
  assertEquals(notifiedEmail, 'new@example.com')
  assertEquals(notifiedProvider, 'google')
})

Deno.test('handleNotifySignupSlack ignores non-signup payloads', async () => {
  let notifyCalled = false
  const res = await handleNotifySignupSlack(
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
  const data = (await res.json()) as { notified: boolean; reason?: string }
  assertEquals(data.notified, false)
  assertEquals(data.reason, 'ignored')
  assertEquals(notifyCalled, false)
})

Deno.test('handleNotifySignupSlack rejects non-POST', async () => {
  const res = await handleNotifySignupSlack(new Request('https://example.com', { method: 'GET' }), {
    authorize: () => true,
  })
  assertEquals(res.status, 405)
})
