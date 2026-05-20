import { assertEquals } from 'jsr:@std/assert@1'

import type { ExplanationsRepository, PrepTestRow, PrepTestTreePrepTestRow } from './explanations.repository.ts'
import {
  createExplanationsService,
  groupPrepTestRows,
  mapPrepTestTreeRows,
  prepTestNumberFromModuleId,
} from './explanations.service.ts'

function mockRepo(overrides: Partial<ExplanationsRepository> = {}): ExplanationsRepository {
  return {
    listAllPrepTestRows: async () => [],
    resolvePrepTestGroup: async () => {
      throw new Error('not implemented')
    },
    fetchPrepTestTreeRows: async () => [],
    fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 0, explainedCount: 0 }),
    getQuestionDetail: async () => null,
    listLatestAnswerStatusByQuestionIds: async () => new Map(),
    ...overrides,
  }
}

Deno.test('prepTestNumberFromModuleId parses LSAC base module', () => {
  assertEquals(prepTestNumberFromModuleId('LSAC159'), '159')
  assertEquals(prepTestNumberFromModuleId('LSAC159:LA:3:7S:S'), '159')
})

Deno.test('groupPrepTestRows collapses split modules', () => {
  const rows: PrepTestRow[] = [
    { id: 'a', module_id: 'LSAC022:LA:3:7S:S', title: 'Logical Reasoning - PT 22', imported_at: null },
    { id: 'b', module_id: 'LSAC022:RC:5:7S:S', title: 'Reading Comprehension - PT 22', imported_at: null },
    { id: 'c', module_id: 'LSAC023', title: 'PrepTest 23', imported_at: null },
  ]
  const grouped = groupPrepTestRows(rows)
  assertEquals(grouped.length, 2)
  assertEquals(grouped.find((g) => g.moduleId === 'LSAC022')?.prepTestIds.length, 2)
})

Deno.test('mapPrepTestTreeRows builds LR synthetic passage', () => {
  const treeRows: PrepTestTreePrepTestRow[] = [
    {
      id: 'pt1',
      module_id: 'LSAC900',
      title: 'PrepTest 900',
      admin_sections: [
        {
          id: 'sec1',
          section_id: 'SEED900-LR-1',
          section_number: 1,
          section_type: 'LR',
          title: 'Logical Reasoning',
          admin_questions: [
            {
              id: 'q1',
              question_number: 1,
              source_group_id: null,
              stem_text: 'Which must be true?',
              stimulus_text: 'All books are hardcover.',
              explanation: null,
              video_url: null,
              difficulty: 3,
            },
            {
              id: 'q2',
              question_number: 2,
              source_group_id: null,
              stem_text: 'The prediction supports which?',
              stimulus_text: null,
              explanation: '<p>Because</p>',
              video_url: 'https://ex.com/v.mp4',
              difficulty: 2,
            },
          ],
        },
      ],
    },
  ]

  const tree = mapPrepTestTreeRows(treeRows, 'pt1', 'LSAC900', 'PrepTest 900', new Map())
  assertEquals(tree.prepTestNumber, '900')
  assertEquals(tree.sections.length, 1)
  assertEquals(tree.sections[0]?.kind, 'LR')
  assertEquals(tree.sections[0]?.passages[0]?.id, 'lr-sec1')
  assertEquals(tree.sections[0]?.passages[0]?.questions.length, 2)
  assertEquals(tree.sections[0]?.passages[0]?.questions[1]?.hasWrittenExplanation, true)
  assertEquals(tree.sections[0]?.passages[0]?.questions[1]?.hasVideo, true)
})

Deno.test('mapPrepTestTreeRows groups RC by source_group_id', () => {
  const treeRows: PrepTestTreePrepTestRow[] = [
    {
      id: 'pt2',
      module_id: 'LSAC901',
      title: 'PrepTest 901',
      admin_sections: [
        {
          id: 'sec-rc',
          section_id: 'RC-1',
          section_number: 1,
          section_type: 'RC',
          title: 'Reading Comprehension',
          admin_passages: [
            {
              id: 'pass1',
              source_group_id: 'grp-a',
              content: 'Scholars have long debated…',
              topic_tag: 'Law',
            },
          ],
          admin_questions: [
            {
              id: 'q-rc-1',
              question_number: 1,
              source_group_id: 'grp-a',
              stem_text: 'Main point?',
              stimulus_text: null,
              explanation: '<p>x</p>',
              video_url: null,
              difficulty: 4,
            },
          ],
        },
      ],
    },
  ]

  const tree = mapPrepTestTreeRows(treeRows, 'pt2', 'LSAC901', 'PrepTest 901', new Map())
  assertEquals(tree.sections[0]?.kind, 'RC')
  assertEquals(tree.sections[0]?.passages[0]?.id, 'pass1')
  assertEquals(tree.sections[0]?.passages[0]?.questions[0]?.hasWrittenExplanation, true)
})

Deno.test('listPrepTests paginates grouped prep tests', async () => {
  const rows: PrepTestRow[] = Array.from({ length: 12 }, (_, i) => ({
    id: `pt-${i}`,
    module_id: `LSAC${String(100 + i).padStart(3, '0')}`,
    title: `PrepTest ${100 + i}`,
    imported_at: null,
  }))
  const service = createExplanationsService({
    repository: mockRepo({
      listAllPrepTestRows: async () => rows,
      fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 10, explainedCount: 2 }),
    }),
  })

  const page1 = await service.listPrepTests({ page: 1, pageSize: 5, sort: 'newest' })
  assertEquals(page1.total, 12)
  assertEquals(page1.page, 1)
  assertEquals(page1.pageSize, 5)
  assertEquals(page1.prepTests.length, 5)

  const page3 = await service.listPrepTests({ page: 3, pageSize: 5, sort: 'newest' })
  assertEquals(page3.prepTests.length, 2)

  const oldest = await service.listPrepTests({ page: 1, pageSize: 5, sort: 'oldest' })
  assertEquals(oldest.prepTests[0]?.prepTestNumber, '100')
})

Deno.test('getExplanationDetail returns extended payload', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      getQuestionDetail: async () => ({
        id: 'q1',
        question_number: 5,
        source_group_id: null,
        stimulus_text: 'Stim',
        stem_text: 'Stem here',
        choices: ['A text', 'B text'],
        correct_answer: 'B',
        explanation: '<p>expl</p>',
        video_url: null,
        difficulty: 3,
        question_types: { name: 'Flaw' },
        admin_sections: {
          id: 'sec1',
          section_type: 'LR',
          section_number: 1,
          title: 'LR',
          admin_prep_tests: { id: 'pt1', title: 'PT 100', module_id: 'LSAC100' },
        },
      }),
    }),
  })

  const d = await service.getExplanationDetail('user-1', 'q1')
  assertEquals(d.questionId, 'q1')
  assertEquals(d.prepTestNumber, '100')
  assertEquals(d.stemText, 'Stem here')
  assertEquals(d.choices.length, 2)
  assertEquals(d.correctChoiceId, 'B')
  assertEquals(d.explanationHtml, '<p>expl</p>')
})
