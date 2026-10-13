import { assertEquals } from 'https://deno.land/std@0.224.0/assert/assert_equals.ts'

import { createPracticeRepository } from './practice.repository.ts'

type QueryResult = { data: unknown; error: null }

function makeClient(handlers: {
  questions?: (ids: string[]) => QueryResult
  passages?: (sectionIds: string[]) => QueryResult
}) {
  return {
    from(table: string) {
      if (table === 'admin_questions') {
        return {
          select() {
            return {
              in(_col: string, ids: string[]) {
                return Promise.resolve(
                  handlers.questions?.(ids) ?? { data: [], error: null },
                )
              },
            }
          },
        }
      }
      if (table === 'admin_passages') {
        return {
          select() {
            return {
              in(_col: string, sectionIds: string[]) {
                return Promise.resolve(
                  handlers.passages?.(sectionIds) ?? { data: [], error: null },
                )
              },
            }
          },
        }
      }
      throw new Error(`Unexpected table ${table}`)
    },
  }
}

Deno.test('getDrillQuestionRowsByIds loads RC passages once per section', async () => {
  let passageCalls = 0
  const repo = createPracticeRepository(
    makeClient({
      questions: (ids) => ({
        data: ids.map((id) => ({
          id,
          question_number: 1,
          source_group_id: 'g1',
          stimulus_text: null,
          stem_text: 'Stem',
          choices: ['A', 'B'],
          correct_answer: 'A',
          difficulty: 2,
          admin_sections: {
            id: 'sec-rc',
            section_type: 'RC',
            section_number: 1,
            title: 'RC',
          },
        })),
        error: null,
      }),
      passages: (sectionIds) => {
        passageCalls += 1
        assertEquals(sectionIds, ['sec-rc'])
        return {
          data: [
            {
              id: 'pass-1',
              section_id: 'sec-rc',
              source_group_id: 'g1',
              content: '<p>Passage body</p>',
              topic_tag: 'Topic',
            },
          ],
          error: null,
        }
      },
    }) as never,
  )

  const rows = await repo.getDrillQuestionRowsByIds(['q1', 'q2'], {
    passageSectionIds: ['sec-rc'],
  })

  assertEquals(passageCalls, 1)
  assertEquals(rows.length, 2)
  const sec = rows[0]!.admin_sections
  const one = Array.isArray(sec) ? sec[0] : sec
  assertEquals(one?.admin_passages?.length, 1)
  assertEquals(one?.admin_passages?.[0]?.content, '<p>Passage body</p>')
  // Same passage object graph attached (not nested N times from PostgREST)
  const sec2 = rows[1]!.admin_sections
  const one2 = Array.isArray(sec2) ? sec2[0] : sec2
  assertEquals(one2?.admin_passages?.[0]?.id, 'pass-1')
})

Deno.test('getDrillQuestionRowsByIds skips passage fetch for LR', async () => {
  let passageCalls = 0
  const repo = createPracticeRepository(
    makeClient({
      questions: (ids) => ({
        data: ids.map((id) => ({
          id,
          question_number: 1,
          source_group_id: null,
          stimulus_text: 'Stimulus',
          stem_text: 'Stem',
          choices: ['A'],
          correct_answer: 'A',
          difficulty: 1,
          admin_sections: {
            id: 'sec-lr',
            section_type: 'LR',
            section_number: 2,
            title: 'LR',
          },
        })),
        error: null,
      }),
      passages: () => {
        passageCalls += 1
        return { data: [], error: null }
      },
    }) as never,
  )

  const rows = await repo.getDrillQuestionRowsByIds(['q1'])
  assertEquals(passageCalls, 0)
  assertEquals(rows.length, 1)
  const sec = rows[0]!.admin_sections
  const one = Array.isArray(sec) ? sec[0] : sec
  assertEquals(one?.admin_passages, undefined)
})
