import { assertEquals } from 'jsr:@std/assert@1'

import { createPracticeRepository } from './practice.repository.ts'

type Call = { rpc?: string; args?: Record<string, unknown>; table?: string; select?: string }

function createClient(opts: { rpcName?: string; rpcData?: unknown }) {
  const calls: Call[] = []
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ rpc: name, args })
      return { data: opts.rpcName && name !== opts.rpcName ? [] : opts.rpcData, error: null }
    },
    from(table: string) {
      const builder = {
        select(cols: string) {
          calls.push({ table, select: cols })
          return builder
        },
        eq() {
          return builder
        },
        then(resolve: (value: { data: unknown; error: null }) => void) {
          resolve({ data: [], error: null })
        },
      }
      return builder
    },
  }
  return { client, calls }
}

Deno.test('listDrillPickerPoolQuestions uses SQL pool RPC without HTML columns', async () => {
  const { client, calls } = createClient({
    rpcName: 'list_drill_picker_pool_questions',
    rpcData: [
      {
        id: 'q1',
        section_id: 's1',
        source_group_id: null,
        difficulty: 3,
        question_type_id: 't1',
        question_number: 2,
        prep_test_id: 'pt1',
        module_id: 'LSAC141',
        section_number: 1,
        tag_label: 'Flaw',
        search_text: 'flaw the argument',
      },
    ],
  })
  const repo = createPracticeRepository(client as never)
  const rows = await repo.listDrillPickerPoolQuestions({ sectionType: 'LR' })
  assertEquals(rows.length, 1)
  assertEquals(rows[0]?.search_text, 'flaw the argument')
  assertEquals(rows[0]?.stimulus_text, null)
  assertEquals(calls[0]?.rpc, 'list_drill_picker_pool_questions')
  assertEquals(calls.some((c) => c.select?.includes('stimulus_text')), false)
})

Deno.test('listLatestAnswerSummariesForUser uses DISTINCT ON RPC', async () => {
  const { client, calls } = createClient({
    rpcName: 'latest_answer_summaries_for_user',
    rpcData: [
      {
        question_id: 'q1',
        is_correct: true,
        time_spent_seconds: 12,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
  })
  const repo = createPracticeRepository(client as never)
  const rows = await repo.listLatestAnswerSummariesForUser('user-1')
  assertEquals(rows[0]?.question_id, 'q1')
  assertEquals(rows[0]?.time_spent_seconds, 12)
  assertEquals(calls[0]?.rpc, 'latest_answer_summaries_for_user')
})

Deno.test('listPrepTestFreshnessRows uses SQL freshness RPC', async () => {
  const { client, calls } = createClient({
    rpcName: 'prep_test_freshness_for_user',
    rpcData: [{ prep_test_id: 'pt1', total: 50, answered: 12 }],
  })
  const repo = createPracticeRepository(client as never)
  const rows = await repo.listPrepTestFreshnessRows('user-1')
  assertEquals(rows, [{ prepTestId: 'pt1', totalQuestions: 50, answeredQuestions: 12 }])
  assertEquals(calls[0]?.rpc, 'prep_test_freshness_for_user')
  assertEquals(calls.some((c) => c.table === 'admin_questions'), false)
})
