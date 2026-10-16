import { assertEquals } from 'jsr:@std/assert@1'
import type { User } from 'npm:@supabase/supabase-js@2'
import { handleDiagnosticSyncMailerlite } from './diagnostic.controller.ts'

function authUser(email = 'student@example.com'): User {
  return { id: 'user-1', email } as User
}

Deno.test('handleDiagnosticSyncMailerlite rejects non-POST', async () => {
  const res = await handleDiagnosticSyncMailerlite(new Request('https://example.com', { method: 'GET' }), {
    requireAuth: async () => ({ ok: true, user: authUser() }),
  })
  assertEquals(res.status, 405)
})

Deno.test('handleDiagnosticSyncMailerlite rejects unauthorized', async () => {
  const res = await handleDiagnosticSyncMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticDone: true, diagnosticType: 'mini' }),
    }),
    {
      requireAuth: async () => ({
        ok: false,
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      }),
    },
  )
  assertEquals(res.status, 401)
})

Deno.test('handleDiagnosticSyncMailerlite syncs mini completion', async () => {
  let syncedEmail = ''
  let done = false
  let type: string | null = null
  let score: number | null | undefined
  const res = await handleDiagnosticSyncMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosticDone: true,
        diagnosticType: 'mini',
        diagnosticScore: 149,
      }),
    }),
    {
      requireAuth: async () => ({ ok: true, user: authUser() }),
      notify: async (input) => {
        syncedEmail = input.email
        done = input.diagnosticDone
        type = input.diagnosticType
        score = input.diagnosticScore
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  const data = (await res.json()) as { synced: boolean }
  assertEquals(data.synced, true)
  assertEquals(syncedEmail, 'student@example.com')
  assertEquals(done, true)
  assertEquals(type, 'mini')
  assertEquals(score, 149)
})

Deno.test('handleDiagnosticSyncMailerlite accepts scaledScore alias', async () => {
  let score: number | null | undefined
  const res = await handleDiagnosticSyncMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diagnosticDone: true,
        diagnosticType: 'full',
        scaledScore: 162.2,
      }),
    }),
    {
      requireAuth: async () => ({ ok: true, user: authUser() }),
      notify: async (input) => {
        score = input.diagnosticScore
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  assertEquals(score, 162)
})

Deno.test('handleDiagnosticSyncMailerlite maps intentId quick to full', async () => {
  let type: string | null = null
  const res = await handleDiagnosticSyncMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticDone: true, intentId: 'quick' }),
    }),
    {
      requireAuth: async () => ({ ok: true, user: authUser() }),
      notify: async (input) => {
        type = input.diagnosticType
        return true
      },
    },
  )
  assertEquals(res.status, 200)
  assertEquals(type, 'full')
})

Deno.test('handleDiagnosticSyncMailerlite rejects done without type', async () => {
  const res = await handleDiagnosticSyncMailerlite(
    new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosticDone: true }),
    }),
    {
      requireAuth: async () => ({ ok: true, user: authUser() }),
      notify: async () => true,
    },
  )
  assertEquals(res.status, 400)
})
