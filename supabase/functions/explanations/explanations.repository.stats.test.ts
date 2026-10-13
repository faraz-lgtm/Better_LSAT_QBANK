import { assertEquals } from 'jsr:@std/assert@1'

import { createExplanationsRepository } from './explanations.repository.ts'

type Call = { rpc?: string; args?: Record<string, unknown>; table?: string; select?: string }

function createClient(opts: { rpcDataByName?: Record<string, unknown> }) {
  const calls: Call[] = []
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ rpc: name, args })
      return { data: opts.rpcDataByName?.[name] ?? [], error: null }
    },
    from(table: string) {
      let inIds: string[] | null = null
      const builder = {
        select(cols: string) {
          calls.push({ table, select: cols })
          return builder
        },
        in(_col: string, ids: unknown[]) {
          inIds = ids.map(String)
          return builder
        },
        eq() {
          return builder
        },
        not() {
          return builder
        },
        then(resolve: (value: { data: unknown; error: null }) => void) {
          if (table === 'admin_sections') {
            resolve({
              data: (inIds ?? []).map((id) => ({ id: `sec-${id}`, prep_test_id: id })),
              error: null,
            })
            return
          }
          if (table === 'admin_questions') {
            resolve({
              data: (inIds ?? []).flatMap((secId, i) => [
                { id: `q${i * 2 + 1}`, section_id: secId },
                { id: `q${i * 2 + 2}`, section_id: secId },
              ]),
              error: null,
            })
            return
          }
          if (table === 'practice_sessions') {
            resolve({ data: [{ metadata: { seenQuestionIds: ['seen-1'] } }], error: null })
            return
          }
          resolve({ data: [], error: null })
        },
      }
      return builder
    },
  }
  return { client, calls }
}

Deno.test('fetchQuestionStatsForPrepTestIds does not download explanation HTML', async () => {
  const { client, calls } = createClient({
    rpcDataByName: {
      admin_prep_test_question_stats: [
        { prep_test_id: 'pt1', total: 2, explained: 1, tagged: 2, difficulty_set: 2, explained_or_video: 1 },
      ],
    },
  })
  const repo = createExplanationsRepository(client as never)
  const stats = await repo.fetchQuestionStatsForPrepTestIds(['pt1'])
  assertEquals(stats.questionCount, 2)
  assertEquals(stats.explainedCount, 1)
  assertEquals(stats.questionIds, ['q1', 'q2'])
  assertEquals(calls.some((c) => c.rpc === 'admin_prep_test_question_stats'), true)
  assertEquals(calls.some((c) => c.select?.includes('explanation')), false)
})

Deno.test('listExplanationQuestionStatusesForIds uses scoped progress RPC', async () => {
  const { client, calls } = createClient({
    rpcDataByName: {
      user_explanation_question_progress_for_ids: [
        { question_id: 'q1', status: 'answered' },
        { question_id: 'q2', status: 'seen' },
      ],
    },
  })
  const repo = createExplanationsRepository(client as never)
  const byId = await repo.listExplanationQuestionStatusesForIds('user-1', ['q1', 'q2', 'q3'])
  assertEquals(byId.get('q1'), 'answered')
  assertEquals(byId.get('q2'), 'seen')
  assertEquals(byId.get('q3'), 'fresh')
  assertEquals(calls.some((c) => c.rpc === 'user_explanation_question_progress_for_ids'), true)
})

Deno.test('fetchQuestionStatsByPrepTestId batches stats for multiple prep tests', async () => {
  const { client, calls } = createClient({
    rpcDataByName: {
      admin_prep_test_question_stats: [
        { prep_test_id: 'pt1', explained_or_video: 1 },
        { prep_test_id: 'pt2', explained_or_video: 3 },
      ],
    },
  })
  const repo = createExplanationsRepository(client as never)
  const byId = await repo.fetchQuestionStatsByPrepTestId(['pt1', 'pt2'])
  assertEquals(byId.get('pt1')?.questionCount, 2)
  assertEquals(byId.get('pt1')?.explainedCount, 1)
  assertEquals(byId.get('pt2')?.questionCount, 2)
  assertEquals(byId.get('pt2')?.explainedCount, 3)
  assertEquals(calls.filter((c) => c.rpc === 'admin_prep_test_question_stats').length, 1)
})

Deno.test('listLsatCatalogQuestionIds uses catalog RPC', async () => {
  const { client, calls } = createClient({
    rpcDataByName: { list_lsat_catalog_question_ids: [{ id: 'q1' }, { id: 'q2' }] },
  })
  const repo = createExplanationsRepository(client as never)
  const ids = await repo.listLsatCatalogQuestionIds()
  assertEquals(ids, ['q1', 'q2'])
  assertEquals(calls[0]?.rpc, 'list_lsat_catalog_question_ids')
})

Deno.test('listPrepTestQuestionProgress uses SQL latest-answer RPC', async () => {
  const { client, calls } = createClient({
    rpcDataByName: {
      user_prep_test_question_progress: [
        { question_id: 'q-ans', session_completed: true },
        { question_id: 'q-ip', session_completed: false },
      ],
    },
  })
  const repo = createExplanationsRepository(client as never)
  const progress = await repo.listPrepTestQuestionProgress('user-1')
  assertEquals(progress.answeredQuestionIds, ['q-ans'])
  assertEquals(progress.inProcessQuestionIds, ['q-ip'])
  assertEquals(progress.seenQuestionIds, ['seen-1'])
  assertEquals(calls.some((c) => c.rpc === 'user_prep_test_question_progress'), true)
})
