import { assertEquals } from 'jsr:@std/assert@1'

import { createAnalyticsRepository } from './analytics.repository.ts'

type Call = { rpc?: string; args?: Record<string, unknown>; table?: string; select?: string; head?: boolean }

function createClient(opts: {
  rpcData?: unknown
  sessionRows?: Array<Record<string, unknown>>
  sessionCount?: number
}) {
  const calls: Call[] = []
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ rpc: name, args })
      return { data: opts.rpcData, error: null }
    },
    from(table: string) {
      const builder: {
        select: (cols: string, options?: { head?: boolean; count?: string }) => typeof builder
        eq: (..._args: unknown[]) => typeof builder
        in: (..._args: unknown[]) => typeof builder
        not: (..._args: unknown[]) => typeof builder
        order: (..._args: unknown[]) => typeof builder
        range: (..._args: unknown[]) => typeof builder
        maybeSingle: () => Promise<{ data: unknown; error: null }>
        then: (resolve: (value: { data: unknown; count: number | null; error: null }) => void) => void
      } = {
        select(cols: string, options?: { head?: boolean; count?: string }) {
          calls.push({ table, select: cols, head: options?.head === true })
          return builder
        },
        eq() {
          return builder
        },
        in() {
          return builder
        },
        not() {
          return builder
        },
        order() {
          return builder
        },
        range() {
          return builder
        },
        async maybeSingle() {
          return { data: null, error: null }
        },
        then(resolve) {
          if (table === 'practice_sessions') {
            resolve({
              data: opts.sessionRows ?? [],
              count: opts.sessionCount ?? (opts.sessionRows ?? []).length,
              error: null,
            })
            return
          }
          resolve({ data: [], count: 0, error: null })
        },
      }
      return builder
    },
  }
  return { client, calls }
}

Deno.test('countAnswerEvents uses SQL aggregate RPC instead of downloading events', async () => {
  const { client, calls } = createClient({ rpcData: 42 })
  const repo = createAnalyticsRepository(client as never)
  const total = await repo.countAnswerEvents('user-1', { completedSince: '2026-01-01T00:00:00Z' })
  assertEquals(total, 42)
  assertEquals(calls[0]?.rpc, 'count_user_visible_answer_events')
  assertEquals(calls[0]?.args?.p_session_kind, null)
  assertEquals(calls.some((c) => c.table === 'answer_events'), false)
})

Deno.test('countDrillAnswerEvents uses SQL correct/total RPC', async () => {
  const { client, calls } = createClient({ rpcData: [{ correct: 7, total: 10 }] })
  const repo = createAnalyticsRepository(client as never)
  const out = await repo.countDrillAnswerEvents('user-1')
  assertEquals(out, { correct: 7, total: 10 })
  assertEquals(calls[0]?.rpc, 'count_user_visible_drill_answer_events')
})

Deno.test('countAnswerEventsByKind passes session kind to SQL count', async () => {
  const { client, calls } = createClient({ rpcData: 5 })
  const repo = createAnalyticsRepository(client as never)
  const total = await repo.countAnswerEventsByKind('user-1', 'SECTION')
  assertEquals(total, 5)
  assertEquals(calls[0]?.args?.p_session_kind, 'SECTION')
})

Deno.test('listAnswerEventsWithTypes uses SQL visibility filter', async () => {
  const { client, calls } = createClient({
    rpcData: [{ question_type_id: 't1', is_correct: true, question_id: 'q1', session_kind: 'DRILL' }],
  })
  const repo = createAnalyticsRepository(client as never)
  const rows = await repo.listAnswerEventsWithTypes('user-1')
  assertEquals(rows.length, 1)
  assertEquals(calls[0]?.rpc, 'list_user_visible_answer_events_with_types')
})

Deno.test('listSessions paginates DRILL rows in the database', async () => {
  const { client, calls } = createClient({
    sessionRows: [{ id: 's1', kind: 'DRILL', metadata: {}, admin_prep_tests: null, admin_sections: null }],
  })
  const repo = createAnalyticsRepository(client as never)
  const rows = await repo.listSessions({
    userId: 'user-1',
    kind: 'DRILL',
    offset: 0,
    limit: 30,
  })
  assertEquals(rows.length, 1)
  assertEquals(calls.some((c) => c.table === 'practice_sessions'), true)
})

Deno.test('countSessions uses a head count for DRILL', async () => {
  const { client, calls } = createClient({ sessionCount: 12 })
  const repo = createAnalyticsRepository(client as never)
  const total = await repo.countSessions({ userId: 'user-1', kind: 'DRILL' })
  assertEquals(total, 12)
  assertEquals(calls.some((c) => c.table === 'practice_sessions' && c.head === true), true)
})
