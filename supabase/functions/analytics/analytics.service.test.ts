import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import type {
  AnalyticsRepository,
  CompletedPreptestRow,
  PracticeSessionListRow,
} from './analytics.repository.ts'
import { createAnalyticsService } from './analytics.service.ts'

function completedPreptestRow(
  overrides: Partial<CompletedPreptestRow> = {},
): CompletedPreptestRow {
  return {
    id: 's1',
    completed_at: '2026-01-01T00:00:00Z',
    raw_score: 85,
    scaled_score: 170,
    percentile: 90,
    blind_review_raw_score: null,
    blind_review_scaled_score: null,
    blind_review_percentile: null,
    blind_review_completed_at: null,
    prep_test_id: 'pt-1',
    admin_prep_tests: { title: 'PT A', module_id: 'LSAC900' },
    ...overrides,
  }
}

function answerEvent(
  overrides: Partial<{
    practice_session_id: string
    question_id: string
    is_correct: boolean
    selected_answer: string
    section_type: 'LR' | 'RC' | 'LG' | null
    created_at: string
  }> = {},
) {
  return {
    practice_session_id: 's1',
    question_id: 'q1',
    is_correct: false,
    selected_answer: 'B',
    section_type: 'LR' as const,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function sessionListRow(
  overrides: Partial<PracticeSessionListRow> = {},
): PracticeSessionListRow {
  return {
    id: 'sess-drill-1',
    kind: 'DRILL',
    prep_test_id: null,
    section_id: null,
    started_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-02T00:00:00Z',
    raw_score: 8,
    scaled_score: 160,
    percentile: 50,
    blind_review_raw_score: null,
    blind_review_scaled_score: null,
    blind_review_percentile: null,
    bookmarked: true,
    excluded: false,
    metadata: { questionTypeId: 'qt-1', questionIds: ['q1', 'q2'] },
    admin_prep_tests: null,
    admin_sections: null,
    ...overrides,
  }
}

function mockRepo(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  const base: AnalyticsRepository = {
    countAnswerEvents: async () => 10,
    countDrillAnswerEvents: async () => ({ correct: 7, total: 10 }),
    listCompletedPreptests: async () => [
      completedPreptestRow({ id: 's1' }),
      completedPreptestRow({
        id: 's2',
        completed_at: '2026-02-01T00:00:00Z',
        raw_score: 80,
        scaled_score: 165,
        percentile: 80,
        admin_prep_tests: { title: 'PT B', module_id: 'LSAC901' },
      }),
    ],
    listAnswerEventsForSessions: async () => [
      answerEvent({ question_id: 'q1', is_correct: false, created_at: '2026-01-01T00:00:00Z' }),
      answerEvent({
        question_id: 'q1',
        is_correct: true,
        selected_answer: 'A',
        created_at: '2026-01-01T00:01:00Z',
      }),
      answerEvent({
        question_id: 'q2',
        is_correct: false,
        section_type: 'RC',
        created_at: '2026-01-01T00:02:00Z',
      }),
    ],
    listAnswerEventsWithTypeDifficulty: async () => [],
    getPracticeSession: async () => null,
    resolveCompletedPrepTestSession: async () => null,
    listSectionSessionsForPrepTest: async () => [],
    listPrepTestQuestionsWithMeta: async () => [],
    listAnswerEventsWithTypes: async () => [
      { question_type_id: 't-low', is_correct: true },
      { question_type_id: 't-low', is_correct: false },
      { question_type_id: 't-high', is_correct: false },
      { question_type_id: 't-high', is_correct: false },
      { question_type_id: 't-high', is_correct: false },
    ],
    listQuestionTypesByIds: async (ids) =>
      ids.map((id) =>
        id === 't-high'
          ? {
              id: 't-high',
              name: 'Hard type',
              section_type: 'LR' as const,
              goal_accuracy: 90,
              avg_per_test: 10,
            }
          : {
              id: 't-low',
              name: 'Easy type',
              section_type: 'LR' as const,
              goal_accuracy: 85,
              avg_per_test: 8,
            },
      ),
    listSessions: async () => [],
    countSessions: async () => 0,
    countAnswerEventsByKind: async () => 0,
    fetchKindSectionAccuracy: async () => [],
    listAnswerEventsForExplanationIndex: async () => [],
    listAdminQuestionsWithExplanationContent: async () => [],
    listQuestionsExplanationMetaByIds: async () => [],
    countAnswerEventsForQuestion: async () => 0,
    getQuestionExplanationPayload: async () => null,
    ...overrides,
  }
  if (overrides.resolveCompletedPrepTestSession === undefined) {
    base.resolveCompletedPrepTestSession = async (userId, sessionIdOrPrepTestId) => {
      const direct = await base.getPracticeSession(sessionIdOrPrepTestId, userId)
      if (direct?.kind === 'PREPTEST' && direct.completed_at) return direct
      return null
    }
  }
  return base
}

// --- getOverview ---

Deno.test('getOverview aggregates scaled scores and drill accuracy', async () => {
  const service = createAnalyticsService({ repository: mockRepo() })
  const o = await service.getOverview('user-1')
  assertEquals(o.bestScaledScore, 170)
  assertEquals(o.averageScaledScore, 167.5)
  assertEquals(o.completedPrepTestCount, 2)
  assertEquals(o.totalQuestionsAnswered, 10)
  assertEquals(o.drillAccuracyPct, 70)
  assertEquals(o.averageLrMissedPerPrepTest, 0)
  assertEquals(o.averageRcMissedPerPrepTest, 1)
})

Deno.test('getOverview returns null scores when no completed preptests', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({ listCompletedPreptests: async () => [] }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.bestScaledScore, null)
  assertEquals(o.averageScaledScore, null)
  assertEquals(o.bestPercentile, null)
  assertEquals(o.averagePercentile, null)
  assertEquals(o.completedPrepTestCount, 0)
  assertEquals(o.averageLrMissedPerPrepTest, null)
  assertEquals(o.averageRcMissedPerPrepTest, null)
})

Deno.test('getOverview returns null drill accuracy when zero drill events', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      countDrillAnswerEvents: async () => ({ correct: 0, total: 0 }),
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.drillAccuracyPct, null)
  assertEquals(o.totalDrillQuestionsAnswered, 0)
})

Deno.test('getOverview uses latest answer per question for LR/RC misses', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [completedPreptestRow({ id: 's1' })],
      listAnswerEventsForSessions: async () => [
        answerEvent({
          question_id: 'q1',
          is_correct: true,
          section_type: 'LR',
          created_at: '2026-01-01T00:00:00Z',
        }),
        answerEvent({
          question_id: 'q1',
          is_correct: false,
          section_type: 'LR',
          created_at: '2026-01-01T00:05:00Z',
        }),
      ],
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.averageLrMissedPerPrepTest, 1)
})

// --- getTrajectory ---

Deno.test('getTrajectory maps completed preptest rows', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [
        completedPreptestRow({
          id: 'traj-1',
          raw_score: 82,
          scaled_score: 168,
          percentile: 88,
          blind_review_raw_score: 84,
          blind_review_scaled_score: 169,
          blind_review_percentile: 90,
          completed_at: '2026-03-01T00:00:00Z',
          admin_prep_tests: { title: 'PT 150', module_id: 'LSAC150' },
        }),
      ],
    }),
  })
  const points = await service.getTrajectory('user-1')
  assertEquals(points.length, 1)
  assertEquals(points[0]?.sessionId, 'traj-1')
  assertEquals(points[0]?.prepTestTitle, 'PT 150')
  assertEquals(points[0]?.moduleId, 'LSAC150')
  assertEquals(points[0]?.scaledScore, 168)
  assertEquals(points[0]?.blindReviewScaledScore, 169)
  assertEquals(points[0]?.completedAt, '2026-03-01T00:00:00Z')
})

Deno.test('getTrajectory falls back when admin_prep_tests is missing', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [
        completedPreptestRow({ admin_prep_tests: null }),
      ],
    }),
  })
  const points = await service.getTrajectory('user-1')
  assertEquals(points[0]?.prepTestTitle, 'PrepTest')
  assertEquals(points[0]?.moduleId, null)
})

// --- getPriorities ---

Deno.test('getPriorities sorts by gap descending', async () => {
  const service = createAnalyticsService({ repository: mockRepo() })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.questionTypeId, 't-high')
})

Deno.test('getPriorities assigns low priority when attempts < 3', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-few', is_correct: false },
        { question_type_id: 't-few', is_correct: false },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-few',
          name: 'Few attempts',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.priorityLevel, 'low')
})

Deno.test('getPriorities assigns high priority when gap >= 15 and attempts >= 3', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-gap', is_correct: true },
        { question_type_id: 't-gap', is_correct: true },
        { question_type_id: 't-gap', is_correct: true },
        { question_type_id: 't-gap', is_correct: false },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-gap',
          name: 'Big gap',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.gap, 15)
  assertEquals(priorities[0]?.priorityLevel, 'high')
})

Deno.test('getPriorities assigns medium priority when gap is 8-14', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-med', is_correct: true },
        { question_type_id: 't-med', is_correct: true },
        { question_type_id: 't-med', is_correct: true },
        { question_type_id: 't-med', is_correct: true },
        { question_type_id: 't-med', is_correct: false },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-med',
          name: 'Medium gap',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.gap, 10)
  assertEquals(priorities[0]?.priorityLevel, 'medium')
})

Deno.test('getPriorities averages difficulty events per type', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-diff', is_correct: true },
        { question_type_id: 't-diff', is_correct: true },
        { question_type_id: 't-diff', is_correct: true },
      ],
      listAnswerEventsWithTypeDifficulty: async () => [
        { question_type_id: 't-diff', difficulty: 2 },
        { question_type_id: 't-diff', difficulty: 4 },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-diff',
          name: 'Diff type',
          section_type: 'LR',
          goal_accuracy: 85,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.difficulty, 3)
})

Deno.test('getPriorities tie-breaks equal gap by attempt count', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-a', is_correct: false },
        { question_type_id: 't-a', is_correct: false },
        { question_type_id: 't-a', is_correct: false },
        { question_type_id: 't-b', is_correct: false },
        { question_type_id: 't-b', is_correct: false },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-a',
          name: 'Type A',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
        {
          id: 't-b',
          name: 'Type B',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.questionTypeId, 't-a')
  assertEquals(priorities[0]?.attemptCount, 3)
  assertEquals(priorities[1]?.questionTypeId, 't-b')
})

Deno.test('getPriorities uses Unknown type when metadata missing', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 'orphan', is_correct: false },
        { question_type_id: 'orphan', is_correct: false },
        { question_type_id: 'orphan', is_correct: false },
      ],
      listQuestionTypesByIds: async () => [],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.name, 'Unknown type')
  assertEquals(priorities[0]?.goalAccuracy, null)
})

// --- getSessions ---

Deno.test('getSessions maps practice session list row', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listSessions: async () => [
        sessionListRow({
          kind: 'SECTION',
          prep_test_id: 'pt-1',
          admin_prep_tests: { title: 'PT 101' },
          admin_sections: { title: 'LR Section 1', section_type: 'LR' },
          blind_review_scaled_score: 162,
          blind_review_percentile: 70,
        }),
      ],
      countSessions: async () => 1,
    }),
  })
  const out = await service.getSessions('user-1', {
    limit: 20,
    offset: 0,
  })
  assertEquals(out.total, 1)
  assertEquals(out.sessions[0]?.kind, 'SECTION')
  assertEquals(out.sessions[0]?.prepTestTitle, 'PT 101')
  assertEquals(out.sessions[0]?.sectionType, 'LR')
  assertEquals(out.sessions[0]?.blindReviewScaledScore, 162)
  assertEquals(out.sessions[0]?.bookmarked, true)
})

Deno.test('getSessions passes filters to repository', async () => {
  const captured: {
    list: {
      userId: string
      kind?: 'PREPTEST' | 'SECTION' | 'DRILL'
      bookmarked?: boolean
      limit: number
      offset: number
    } | null
    count: {
      userId: string
      kind?: 'PREPTEST' | 'SECTION' | 'DRILL'
      bookmarked?: boolean
    } | null
  } = { list: null, count: null }
  const service = createAnalyticsService({
    repository: mockRepo({
      listSessions: async (input) => {
        captured.list = input
        return []
      },
      countSessions: async (input) => {
        captured.count = input
        return 5
      },
    }),
  })
  const out = await service.getSessions('user-1', {
    kind: 'DRILL',
    bookmarked: true,
    limit: 10,
    offset: 5,
  })
  assertEquals(captured.list?.kind, 'DRILL')
  assertEquals(captured.list?.bookmarked, true)
  assertEquals(captured.list?.limit, 10)
  assertEquals(captured.list?.offset, 5)
  assertEquals(captured.count?.kind, 'DRILL')
  assertEquals(captured.count?.bookmarked, true)
  assertEquals(out.total, 5)
  assertEquals(out.limit, 10)
  assertEquals(out.offset, 5)
})

// --- getKindBreakdown ---

Deno.test('getKindBreakdown aggregates section accuracy', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      fetchKindSectionAccuracy: async () => [
        { section_type: 'LR', is_correct: true },
        { section_type: 'LR', is_correct: false },
        { section_type: 'RC', is_correct: true },
        { section_type: 'RC', is_correct: true },
        { section_type: 'RC', is_correct: false },
      ],
      countAnswerEventsByKind: async () => 5,
    }),
  })
  const out = await service.getKindBreakdown('user-1', 'SECTION')
  assertEquals(out.sessionKind, 'SECTION')
  assertEquals(out.totalAnswered, 5)
  assertEquals(out.sections.length, 2)
  const lr = out.sections.find((s) => s!.sectionType === 'LR')!
  const rc = out.sections.find((s) => s!.sectionType === 'RC')!
  assertEquals(lr.accuracyPct, 50)
  assertEquals(lr.correct, 1)
  assertEquals(lr.total, 2)
  assertEquals(rc.accuracyPct, 66.7)
})

Deno.test('getKindBreakdown returns empty sections when no events', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      fetchKindSectionAccuracy: async () => [],
      countAnswerEventsByKind: async () => 0,
    }),
  })
  const out = await service.getKindBreakdown('user-1', 'DRILL')
  assertEquals(out.sections, [])
  assertEquals(out.totalAnswered, 0)
})

// --- getPrepTestSessionDetail ---

const PREP_TEST_COMPLETED_AT = '2026-01-01T12:00:00Z'

function prepTestSessionFixture(
  overrides: Partial<{
    id: string
    kind: string
    prep_test_id: string | null
    completed_at: string | null
    scaled_score: number | null
    blind_review_scaled_score: number | null
  }> = {},
) {
  return {
    id: 'pt-session-1',
    kind: 'PREPTEST',
    prep_test_id: 'pt-1',
    completed_at: PREP_TEST_COMPLETED_AT,
    started_at: '2026-01-01T10:00:00Z',
    raw_score: 80,
    scaled_score: 165,
    percentile: 85,
    blind_review_raw_score: 82,
    blind_review_scaled_score: 167,
    blind_review_percentile: 88,
    blind_review_completed_at: '2026-01-02T00:00:00Z',
    excluded: false,
    metadata: {},
    admin_prep_tests: { title: 'PT 101', module_id: 'LSAC101' },
    ...overrides,
  }
}

function prepTestQuestion(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'q-lr-1',
    question_number: 1,
    stem_text: 'Short stem',
    correct_answer: 'C',
    difficulty: 3,
    question_types: { name: 'Flaw' },
    admin_sections: { section_type: 'LR', section_number: 1 },
    ...overrides,
  }
}

Deno.test('getPrepTestSessionDetail separates at-completion vs blind review correctness', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture(),
      listSectionSessionsForPrepTest: async () => [{ id: 'sec-s1', section_id: 's1', completed_at: PREP_TEST_COMPLETED_AT, raw_score: 20 }],
      listAnswerEventsForSessions: async () => [
        {
          practice_session_id: 'sec-s1',
          question_id: 'q-lr-1',
          is_correct: false,
          selected_answer: 'B',
          section_type: 'LR',
          created_at: '2026-01-01T11:00:00Z',
        },
        {
          practice_session_id: 'sec-s1',
          question_id: 'q-lr-1',
          is_correct: true,
          selected_answer: 'C',
          section_type: 'LR',
          created_at: '2026-01-01T13:00:00Z',
        },
      ],
      listPrepTestQuestionsWithMeta: async () => [prepTestQuestion()],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-session-1')
  const q = d.questions.find((row) => row.id === 'q-lr-1')
  assertEquals(q?.actualCorrect, false)
  assertEquals(q?.blindReviewCorrect, true)
  assertEquals(q?.selectedLetter, 'C')
})

Deno.test('getPrepTestSessionDetail counts correct from at-completion only', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture(),
      listSectionSessionsForPrepTest: async () => [{ id: 'sec-s1', section_id: 's1', completed_at: PREP_TEST_COMPLETED_AT, raw_score: 20 }],
      listAnswerEventsForSessions: async () => [
        {
          practice_session_id: 'sec-s1',
          question_id: 'q-lr-1',
          is_correct: true,
          selected_answer: 'C',
          section_type: 'LR',
          created_at: '2026-01-01T11:00:00Z',
        },
        {
          practice_session_id: 'sec-s1',
          question_id: 'q-rc-1',
          is_correct: false,
          selected_answer: 'A',
          section_type: 'RC',
          created_at: '2026-01-01T11:30:00Z',
        },
        {
          practice_session_id: 'sec-s1',
          question_id: 'q-rc-1',
          is_correct: true,
          selected_answer: 'D',
          section_type: 'RC',
          created_at: '2026-01-01T13:00:00Z',
        },
      ],
      listPrepTestQuestionsWithMeta: async () => [
        prepTestQuestion({ id: 'q-lr-1' }),
        prepTestQuestion({ id: 'q-rc-1', question_number: 2, admin_sections: { section_type: 'RC', section_number: 2 } }),
      ],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-session-1')
  assertEquals(d.correct, 1)
  assertEquals(d.incorrect, 1)
  assertEquals(d.totalQuestions, 2)
  assertEquals(d.scaledScore, 165)
  assertEquals(d.blindReviewScore, 167)
})

Deno.test('getPrepTestSessionDetail resolves latest completed session by prep test id', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => null,
      resolveCompletedPrepTestSession: async () => prepTestSessionFixture({ id: 'pt-session-1', prep_test_id: 'pt-900' }),
      listSectionSessionsForPrepTest: async () => [{ id: 'sec-s1', section_id: 's1', completed_at: PREP_TEST_COMPLETED_AT, raw_score: 20 }],
      listPrepTestQuestionsWithMeta: async () => [],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-900')
  assertEquals(d.prepTestId, 'pt-900')
})

Deno.test('getPrepTestSessionDetail rejects incomplete or non-preptest session', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () =>
        prepTestSessionFixture({ kind: 'SECTION', completed_at: PREP_TEST_COMPLETED_AT }),
    }),
  })
  await assertRejects(
    () => service.getPrepTestSessionDetail('user-1', 'pt-session-1'),
    Error,
    'not found',
  )

  const service2 = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture({ completed_at: null }),
    }),
  })
  await assertRejects(
    () => service2.getPrepTestSessionDetail('user-1', 'pt-session-1'),
    Error,
    'not found',
  )
})

Deno.test('getPrepTestSessionDetail rejects missing prep_test_id', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture({ prep_test_id: null }),
    }),
  })
  await assertRejects(
    () => service.getPrepTestSessionDetail('user-1', 'pt-session-1'),
    Error,
    'prep_test_id',
  )
})

Deno.test('getPrepTestSessionDetail uses PT section question reference titles', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture(),
      listSectionSessionsForPrepTest: async () => [],
      listAnswerEventsForSessions: async () => [],
      listPrepTestQuestionsWithMeta: async () => [
        prepTestQuestion({
          id: 'q-long',
          question_types: null,
          stem_text: 'A'.repeat(80),
        }),
        prepTestQuestion({
          id: 'q-num',
          question_number: 7,
          question_types: null,
          stem_text: '',
        }),
      ],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-session-1')
  const longQ = d.questions.find((row) => row.id === 'q-long')
  const numQ = d.questions.find((row) => row.id === 'q-num')
  assertEquals(longQ?.title, 'PT 101  .  S1  .  Q1')
  assertEquals(numQ?.title, 'PT 101  .  S1  .  Q7')
})

Deno.test('getPrepTestSessionDetail maps difficulty labels', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture(),
      listSectionSessionsForPrepTest: async () => [],
      listAnswerEventsForSessions: async () => [],
      listPrepTestQuestionsWithMeta: async () => [
        prepTestQuestion({ id: 'q1', difficulty: 1 }),
        prepTestQuestion({ id: 'q2', difficulty: 2 }),
        prepTestQuestion({ id: 'q3', difficulty: 3 }),
        prepTestQuestion({ id: 'q4', difficulty: 4 }),
        prepTestQuestion({ id: 'q5', difficulty: 5 }),
      ],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-session-1')
  const labels = d.questions.map((q) => q.difficulty)
  assertEquals(labels, ['Easiest', 'Easy', 'Medium', 'Hard', 'Hardest'])
})

// --- legacy explanations ---

Deno.test('listExplanations lists admin PrepTest questions with explanation or video', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAdminQuestionsWithExplanationContent: async () => [
        {
          id: 'q2',
          question_number: 3,
          explanation: null,
          video_url: 'https://example.com/v.mp4',
          updated_at: '2026-01-15T00:00:00Z',
          question_types: { name: 'Main point' },
          admin_sections: {
            section_type: 'RC' as const,
            section_number: 1,
            admin_prep_tests: { title: 'PT 99' },
          },
        },
        {
          id: 'q1',
          question_number: 12,
          explanation: '<p>Hi</p>',
          video_url: '',
          updated_at: '2026-02-01T00:00:00Z',
          question_types: { name: 'Flaw' },
          admin_sections: {
            section_type: 'LR' as const,
            section_number: 1,
            admin_prep_tests: { title: 'PT 99' },
          },
        },
      ],
    }),
  })
  const { explanations } = await service.listExplanations('user-1')
  assertEquals(explanations.length, 2)
  assertEquals(explanations[0]?.questionId, 'q1')
  assertEquals(explanations[0]?.lastAttemptedAt, '2026-02-01T00:00:00Z')
  assertEquals(explanations[0]?.hasWrittenExplanation, true)
  assertEquals(explanations[0]?.hasVideo, false)
  assertEquals(explanations[1]?.questionId, 'q2')
  assertEquals(explanations[1]?.hasVideo, true)
})

Deno.test('getExplanationDetail returns payload without requiring attempts', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getQuestionExplanationPayload: async () => ({
        id: 'q1',
        question_number: 5,
        explanation: '<p>x</p>',
        video_url: 'https://ex.com/a.mp4',
        question_types: { name: 'Strengthen' },
        admin_sections: {
          section_type: 'LR' as const,
          section_number: 2,
          admin_prep_tests: { title: 'PT 100' },
        },
      }),
    }),
  })
  const d = await service.getExplanationDetail('user-1', 'q1')
  assertEquals(d.questionId, 'q1')
  assertEquals(d.prepTestTitle, 'PT 100')
  assertEquals(d.explanationHtml, '<p>x</p>')
  assertEquals(d.videoUrl, 'https://ex.com/a.mp4')
})

Deno.test('getExplanationDetail rejects when question not found', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getQuestionExplanationPayload: async () => null,
    }),
  })
  await assertRejects(
    () => service.getExplanationDetail('user-1', 'missing'),
    Error,
    'Question not found',
  )
})
