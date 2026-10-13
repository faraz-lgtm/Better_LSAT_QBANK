import { assertEquals } from 'jsr:@std/assert@1'

import { createPracticeRepository } from './practice.repository.ts'

type Call = { select: string; kind?: string }

Deno.test('listUserSessionsForPrepTest fetches PREPTEST + slim SECTION in parallel', async () => {
  const calls: Call[] = []
  const client = {
    from(table: string) {
      assertEquals(table, 'practice_sessions')
      let selectCols = ''
      let kind: string | undefined
      const builder = {
        select(cols: string) {
          selectCols = cols
          return builder
        },
        eq(column: string, value: unknown) {
          if (column === 'kind') kind = String(value)
          return builder
        },
        order() {
          return builder
        },
        then(resolve: (value: { data: unknown; error: null }) => void) {
          calls.push({ select: selectCols, kind })
          if (kind === 'PREPTEST') {
            resolve({
              data: [
                {
                  id: 'pt-sess',
                  user_id: 'user-1',
                  kind: 'PREPTEST',
                  prep_test_id: 'pt-900',
                  section_id: null,
                  started_at: '2026-01-02T00:00:00Z',
                  completed_at: null,
                  raw_score: null,
                  scaled_score: null,
                  metadata: { timing: 'standard' },
                },
              ],
              error: null,
            })
            return
          }
          resolve({
            data: [
              {
                id: 'sec-sess',
                user_id: 'user-1',
                kind: 'SECTION',
                prep_test_id: 'pt-900',
                section_id: 'sec-lr',
                started_at: '2026-01-02T01:00:00Z',
                completed_at: null,
                raw_score: null,
                scaled_score: null,
                answered_question_ids: ['q1'],
                question_ids: ['q1', 'q2'],
              },
            ],
            error: null,
          })
        },
      }
      return builder
    },
  }

  const repo = createPracticeRepository(client as never)
  const sessions = await repo.listUserSessionsForPrepTest('user-1', 'pt-900')

  assertEquals(calls.length, 2)
  const prepCall = calls.find((c) => c.kind === 'PREPTEST')
  const sectionCall = calls.find((c) => c.kind === 'SECTION')
  assertEquals(Boolean(prepCall?.select.includes('metadata')), true)
  assertEquals(Boolean(prepCall?.select.includes('answered_question_ids')), false)
  assertEquals(
    Boolean(sectionCall?.select.includes('answered_question_ids:metadata->answeredQuestionIds')),
    true,
  )
  assertEquals(Boolean(sectionCall?.select.includes('question_ids:metadata->questionIds')), true)
  assertEquals(sessions.length, 2)
  assertEquals(sessions[0]?.id, 'sec-sess')
  assertEquals(sessions[0]?.metadata, {
    answeredQuestionIds: ['q1'],
    questionIds: ['q1', 'q2'],
  })
  assertEquals(sessions[1]?.metadata, { timing: 'standard' })
})
