import { assertEquals } from 'jsr:@std/assert@1'

import type { ExplanationsRepository, PrepTestRow, PrepTestTreePrepTestRow } from './explanations.repository.ts'
import {
  buildAnswerPopularity,
  buildExplanationStatusCounts,
  createExplanationsService,
  groupPrepTestRows,
  mapPrepTestTreeRows,
  mapStoredAnswerToLetter,
  prepTestNumberFromModuleId,
  prepTestRowSubtitleFromStatuses,
  resolveExplanationQuestionStatus,
  topicNameFromQuestion,
} from './explanations.service.ts'

function mockRepo(overrides: Partial<ExplanationsRepository> = {}): ExplanationsRepository {
  return {
    listAllPrepTestRows: async () => [],
    resolvePrepTestGroup: async () => {
      throw new Error('not implemented')
    },
    fetchPrepTestTreeRows: async () => [],
    listQuestionTypeNames: async () => new Map(),
    fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 0, explainedCount: 0, questionIds: [] }),
    getQuestionDetail: async () => null,
    listLatestAnswerStatusByQuestionIds: async () => new Map(),
    listLsatCatalogQuestionIds: async () => [],
    listDistinctAnsweredQuestionIdsForUser: async () => [],
    listPrepTestQuestionProgress: async () => ({
      seenQuestionIds: [],
      inProcessQuestionIds: [],
      answeredQuestionIds: [],
    }),
    listLatestAnswerSelectionsForQuestion: async () => [],
    getLatestUserAnswerSelection: async () => null,
    getPublishedPassageAnalysis: async () => null,
    listBookmarkedQuestionIds: async () => [],
    setQuestionBookmark: async () => {},
    listPrepTestIdsForQuestionIds: async () => [],
    ...overrides,
  }
}

Deno.test('buildAnswerPopularity counts latest selections per letter', () => {
  const rows = buildAnswerPopularity(
    [{ letter: 'B' }, { letter: 'B' }, { letter: 'A' }, { letter: 'C' }],
    ['A', 'B', 'C', 'D', 'E'],
    'B',
  )
  assertEquals(rows.find((r) => r.letter === 'B')?.count, 2)
  assertEquals(rows.find((r) => r.letter === 'B')?.pct, 50)
  assertEquals(rows.find((r) => r.letter === 'B')?.highlight, true)
  assertEquals(rows.find((r) => r.letter === 'A')?.highlight, undefined)
  assertEquals(rows.find((r) => r.letter === 'B')?.avgScore, null)
})

Deno.test('buildAnswerPopularity averages scaled scores per letter', () => {
  const rows = buildAnswerPopularity(
    [
      { letter: 'B', scaledScore: 163 },
      { letter: 'B', scaledScore: 161 },
      { letter: 'A', scaledScore: 152 },
      { letter: 'C' },
    ],
    ['A', 'B', 'C', 'D', 'E'],
    'B',
  )
  assertEquals(rows.find((r) => r.letter === 'B')?.avgScore, 162)
  assertEquals(rows.find((r) => r.letter === 'A')?.avgScore, 152)
  assertEquals(rows.find((r) => r.letter === 'C')?.avgScore, null)
})

Deno.test('mapStoredAnswerToLetter resolves choice id and numeric index', () => {
  const choices = [
    { id: 'A', index: 1 },
    { id: 'B', index: 2 },
    { id: 'C', index: 3 },
  ]
  const letters = ['A', 'B', 'C', 'D', 'E'] as const
  assertEquals(mapStoredAnswerToLetter('B', choices, letters), 'B')
  assertEquals(mapStoredAnswerToLetter('2', choices, letters), 'B')
  const mapped = ['A', '2', 'C']
    .map((raw) => mapStoredAnswerToLetter(raw, choices, letters))
    .filter((l): l is string => l != null)
  assertEquals(mapped, ['A', 'B', 'C'])
})

Deno.test('buildExplanationStatusCounts classifies fresh, seen, in_process, answered', () => {
  const counts = buildExplanationStatusCounts(['q1', 'q2', 'q3', 'q4'], {
    seenQuestionIds: new Set(['q4']),
    inProcessQuestionIds: new Set(['q2']),
    answeredQuestionIds: new Set(['q1']),
  })
  assertEquals(counts.answered, 1)
  assertEquals(counts.in_process, 1)
  assertEquals(counts.seen, 1)
  assertEquals(counts.fresh, 1)
})

Deno.test('resolveExplanationQuestionStatus prefers answered over seen', () => {
  const progress = {
    seenQuestionIds: new Set(['q1']),
    inProcessQuestionIds: new Set(['q1']),
    answeredQuestionIds: new Set(['q1']),
  }
  assertEquals(resolveExplanationQuestionStatus('q1', progress), 'answered')
})

Deno.test('prepTestNumberFromModuleId parses LSAC base module', () => {
  assertEquals(prepTestNumberFromModuleId('LSAC159'), '159')
  assertEquals(prepTestNumberFromModuleId('LSAC159:LA:3:7S:S'), '159')
})

Deno.test('topicNameFromQuestion uses type id lookup when embed is missing', () => {
  const base = {
    id: 'q1',
    question_number: 1,
    source_group_id: null,
    stem_text: 'Stem',
    stimulus_text: null,
    explanation: null,
    video_url: null,
    difficulty: 3,
  }
  assertEquals(topicNameFromQuestion({ ...base, question_types: { name: 'Flaw' } }), 'Flaw')
  assertEquals(
    topicNameFromQuestion({ ...base, question_type_id: 'qt-1' }, new Map([['qt-1', 'Weaken']])),
    'Weaken',
  )
  assertEquals(topicNameFromQuestion(base), '—')
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
              question_type_id: 'qt-mbt',
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

  const tree = mapPrepTestTreeRows(
    treeRows,
    'pt1',
    'LSAC900',
    'PrepTest 900',
    new Map(),
    new Map([['qt-mbt', 'Must Be True']]),
  )
  assertEquals(tree.prepTestNumber, '900')
  assertEquals(tree.sections.length, 1)
  assertEquals(tree.sections[0]?.kind, 'LR')
  assertEquals(tree.sections[0]?.passages[0]?.id, 'lr-sec1')
  assertEquals(tree.sections[0]?.passages[0]?.questions.length, 2)
  assertEquals(tree.sections[0]?.passages[0]?.questions[0]?.topicName, 'Must Be True')
  assertEquals(tree.sections[0]?.passages[0]?.questions[1]?.topicName, '—')
  assertEquals(tree.sections[0]?.passages[0]?.questions[1]?.hasWrittenExplanation, true)
  assertEquals(tree.sections[0]?.passages[0]?.questions[1]?.hasVideo, true)
})

Deno.test('getPrepTestTree resolves topic names from question_type_id', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      resolvePrepTestGroup: async () => ({
        primary: { id: 'pt1', module_id: 'LSAC900', title: 'PrepTest 900', imported_at: null },
        prepTestIds: ['pt1'],
        baseModuleId: 'LSAC900',
      }),
      fetchPrepTestTreeRows: async () => [
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
                  stimulus_text: null,
                  explanation: null,
                  video_url: null,
                  difficulty: 3,
                  question_type_id: 'qt-mbt',
                },
              ],
            },
          ],
        },
      ],
      listQuestionTypeNames: async () => new Map([['qt-mbt', 'Must Be True']]),
    }),
  })

  const { prepTest } = await service.getPrepTestTree('user-1', 'pt1')
  assertEquals(prepTest.sections[0]?.passages[0]?.questions[0]?.topicName, 'Must Be True')
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

Deno.test('mapPrepTestTreeRows orders RC passages by first question number', () => {
  const treeRows: PrepTestTreePrepTestRow[] = [
    {
      id: 'pt-rc-order',
      module_id: 'LSAC157',
      title: 'PrepTest 157',
      admin_sections: [
        {
          id: 'sec-rc',
          section_id: 'RC157-1',
          section_number: 1,
          section_type: 'RC',
          title: 'Reading Comprehension',
          admin_passages: [
            {
              id: 'pass-late',
              source_group_id: 'grp-late',
              content: 'Some environmentalists claim…',
              topic_tag: null,
            },
            {
              id: 'pass-early',
              source_group_id: 'grp-early',
              content: 'The late 1950s and early 1960s…',
              topic_tag: null,
            },
          ],
          admin_questions: [
            {
              id: 'q20',
              question_number: 20,
              source_group_id: 'grp-late',
              stem_text: 'Q20?',
              stimulus_text: null,
              explanation: null,
              video_url: null,
              difficulty: 3,
            },
            {
              id: 'q1',
              question_number: 1,
              source_group_id: 'grp-early',
              stem_text: 'Q1?',
              stimulus_text: null,
              explanation: null,
              video_url: null,
              difficulty: 3,
            },
            {
              id: 'q7',
              question_number: 7,
              source_group_id: 'grp-mid',
              stem_text: 'Q7?',
              stimulus_text: null,
              explanation: null,
              video_url: null,
              difficulty: 3,
            },
          ],
        },
      ],
    },
  ]

  const tree = mapPrepTestTreeRows(treeRows, 'pt-rc-order', 'LSAC157', 'PrepTest 157', new Map())
  const passages = tree.sections[0]?.passages ?? []
  assertEquals(passages.map((p) => p.label), ['P1', 'P2', 'P3'])
  assertEquals(passages.map((p) => p.questions[0]?.number), [1, 7, 20])
  assertEquals(passages[0]?.questions[0]?.code, 'PT157.S1.P1.Q1')
  assertEquals(passages[1]?.questions[0]?.code, 'PT157.S1.P2.Q7')
  assertEquals(passages[2]?.questions[0]?.code, 'PT157.S1.P3.Q20')
})

Deno.test('prepTestRowSubtitleFromStatuses matches Figma status tags', () => {
  assertEquals(prepTestRowSubtitleFromStatuses(['fresh', 'fresh']), 'Fresh')
  assertEquals(prepTestRowSubtitleFromStatuses(['fresh', 'in_process']), 'In Process • Blind Review')
  assertEquals(prepTestRowSubtitleFromStatuses(['answered', 'seen']), 'Answered')
  assertEquals(prepTestRowSubtitleFromStatuses(['seen']), 'Seen')
  assertEquals(prepTestRowSubtitleFromStatuses([]), 'Fresh')
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
      fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 10, explainedCount: 2, questionIds: [] }),
    }),
  })

  const page1 = await service.listPrepTests('user-1', { page: 1, pageSize: 5, sort: 'newest' })
  assertEquals(page1.total, 12)
  assertEquals(page1.page, 1)
  assertEquals(page1.pageSize, 5)
  assertEquals(page1.prepTests.length, 5)
  assertEquals(page1.prepTests[0]?.rowSubtitle, 'Fresh')
  assertEquals(page1.statusCounts.fresh, 0)

  const page3 = await service.listPrepTests('user-1', { page: 3, pageSize: 5, sort: 'newest' })
  assertEquals(page3.prepTests.length, 2)

  const oldest = await service.listPrepTests('user-1', { page: 1, pageSize: 5, sort: 'oldest' })
  assertEquals(oldest.prepTests[0]?.prepTestNumber, '100')
})

Deno.test('listPrepTests hides pre-PT100 tests', async () => {
  const rows: PrepTestRow[] = [
    { id: 'pt-99', module_id: 'LSAC099', title: 'PrepTest 99', imported_at: null },
    { id: 'pt-100', module_id: 'LSAC100', title: 'PrepTest 100', imported_at: null },
    { id: 'pt-101', module_id: 'LSAC101', title: 'PrepTest 101', imported_at: null },
  ]
  const service = createExplanationsService({
    repository: mockRepo({
      listAllPrepTestRows: async () => rows,
      fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 10, explainedCount: 2, questionIds: [] }),
    }),
  })

  const out = await service.listPrepTests('user-1', { page: 1, pageSize: 10, sort: 'oldest' })
  assertEquals(out.total, 2)
  assertEquals(out.prepTests.map((pt) => pt.prepTestNumber), ['100', '101'])
})

Deno.test('getExplanationStatusCounts uses student-visible catalog only', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      listLsatCatalogQuestionIds: async () => ['q100', 'q101'],
      listPrepTestQuestionProgress: async () => ({
        seenQuestionIds: ['q99-hidden'],
        inProcessQuestionIds: ['q100'],
        answeredQuestionIds: ['q101'],
      }),
    }),
  })

  const counts = await service.getExplanationStatusCounts('user-1')
  assertEquals(counts.answered, 1)
  assertEquals(counts.in_process, 1)
  assertEquals(counts.seen, 0)
  assertEquals(counts.fresh, 0)
})

Deno.test('listPrepTests returns global statusCounts for user', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      listAllPrepTestRows: async () => [
        { id: 'pt-1', module_id: 'LSAC158', title: 'PT 158', imported_at: null },
      ],
      fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 103, explainedCount: 3, questionIds: [] }),
      listLsatCatalogQuestionIds: async () => ['q1', 'q2', 'q3'],
      listPrepTestQuestionProgress: async () => ({
        seenQuestionIds: ['q3'],
        inProcessQuestionIds: ['q2'],
        answeredQuestionIds: ['q1'],
      }),
    }),
  })

  const out = await service.listPrepTests('user-1', { page: 1, pageSize: 5 })
  assertEquals(out.statusCounts.answered, 1)
  assertEquals(out.statusCounts.in_process, 1)
  assertEquals(out.statusCounts.seen, 1)
  assertEquals(out.statusCounts.fresh, 0)
})

Deno.test('getExplanationDetail returns extended payload', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      listLatestAnswerSelectionsForQuestion: async () => ['B', 'B', 'A'],
      getLatestUserAnswerSelection: async () => 'A',
      getQuestionDetail: async () => ({
        id: 'q1',
        question_number: 5,
        source_group_id: null,
        stimulus_text: 'Stim',
        stem_text: 'Stem here',
        choices: [
          { optionLetter: 'A', optionContent: 'A text', optionExplanation: '<p>Why not A</p>' },
          { optionLetter: 'B', optionContent: 'B text' },
        ],
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
  assertEquals(d.choices[0]!.explanationHtml, '<p>Why not A</p>')
  assertEquals(d.choices[1]!.explanationHtml, null)
  assertEquals(d.answerPopularity.length, 2)
  assertEquals(d.answerPopularity.find((r) => r.letter === 'B')?.count, 2)
  assertEquals(d.answerPopularity.find((r) => r.letter === 'B')?.pct, 67)
  assertEquals(d.userSelectedLetter, 'A')
  assertEquals(d.tags, ['Flaw', 'LR'])
  assertEquals(d.passageAnalysis, null)
})

Deno.test('getExplanationDetail returns RC passageAnalysis paragraphs as P1, P2', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      getQuestionDetail: async () => ({
        id: 'q-rc',
        question_number: 1,
        source_group_id: 'RC-Z060',
        stimulus_text: null,
        stem_text: 'RC stem',
        choices: [{ optionLetter: 'A', optionContent: 'A' }],
        correct_answer: 'A',
        explanation: null,
        video_url: null,
        difficulty: 2,
        question_types: { name: 'Main Point' },
        admin_sections: {
          id: 'sec-rc',
          section_type: 'RC',
          section_number: 1,
          title: 'RC',
          admin_prep_tests: { id: 'pt101', title: 'PT 101', module_id: 'LSAC101' },
          admin_passages: [
            {
              id: 'pass-1',
              source_group_id: 'RC-Z060',
              content: '<p>Passage para 1</p><p>Passage para 2</p>',
              topic_tag: null,
            },
          ],
        },
      }),
      getPublishedPassageAnalysis: async (passageId) => {
        assertEquals(passageId, 'pass-1')
        return {
          analysisId: 'an-1',
          overallHtml: '<p>Overall takeaway</p>',
          paragraphs: [
            {
              partLabel: 'P1',
              sortOrder: 1,
              explanationHtml: '<p>Analysis one</p>',
              textExcerpt: 'Passage para 1',
            },
            {
              partLabel: 'P2',
              sortOrder: 2,
              explanationHtml: '<p>Analysis two</p>',
              textExcerpt: 'Passage para 2',
            },
          ],
        }
      },
    }),
  })

  const d = await service.getExplanationDetail('user-1', 'q-rc')
  assertEquals(d.passageAnalysis?.paragraphs.map((p) => p.label), ['P1', 'P2'])
  assertEquals(d.passageAnalysis?.paragraphs[0]?.explanationHtml, '<p>Analysis one</p>')
  assertEquals(
    d.passageAnalysis?.paragraphs[0]?.passageHtml,
    '<p>Passage para 1</p>',
  )
  assertEquals(d.passageAnalysis?.overallHtml, '<p>Overall takeaway</p>')
})

Deno.test('getExplanationDetail returns null userSelectedLetter when never answered', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      getQuestionDetail: async () => ({
        id: 'q1',
        question_number: 5,
        source_group_id: null,
        stimulus_text: 'Stim',
        stem_text: 'Stem here',
        choices: [
          { optionLetter: 'A', optionContent: 'A text' },
          { optionLetter: 'B', optionContent: 'B text' },
        ],
        correct_answer: 'B',
        explanation: null,
        video_url: null,
        difficulty: 2,
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
  assertEquals(d.userSelectedLetter, null)
})

Deno.test('listPrepTests bookmarkedOnly keeps prep tests that contain bookmarks', async () => {
  const service = createExplanationsService({
    repository: mockRepo({
      listAllPrepTestRows: async () => [
        { id: 'pt-keep', module_id: 'LSAC157', title: 'PT 157', imported_at: null },
        { id: 'pt-skip', module_id: 'LSAC158', title: 'PT 158', imported_at: null },
      ],
      listBookmarkedQuestionIds: async () => ['q-booked'],
      listPrepTestIdsForQuestionIds: async (ids) => (ids.includes('q-booked') ? ['pt-keep'] : []),
      fetchQuestionStatsForPrepTestIds: async () => ({ questionCount: 4, explainedCount: 1, questionIds: [] }),
    }),
  })
  const out = await service.listPrepTests('user-1', { page: 1, pageSize: 10, bookmarkedOnly: true })
  assertEquals(out.prepTests.map((pt) => pt.id), ['pt-keep'])
  assertEquals(out.total, 1)
})

Deno.test('setQuestionBookmark persists and returns ids', async () => {
  const stored: string[] = []
  const service = createExplanationsService({
    repository: mockRepo({
      setQuestionBookmark: async (_userId, questionId, bookmarked) => {
        if (bookmarked) stored.push(questionId)
        else stored.splice(stored.indexOf(questionId), 1)
      },
      listBookmarkedQuestionIds: async () => [...stored],
    }),
  })
  const out = await service.setQuestionBookmark('user-1', 'q9', true)
  assertEquals(out.questionIds, ['q9'])
})
