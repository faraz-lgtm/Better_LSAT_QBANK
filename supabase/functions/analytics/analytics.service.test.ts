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
    started_at: '2025-12-31T00:00:00Z',
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
    sumCompletedSessionStudyMinutes: async () => 60,
    sumCompletedLessonStudyMinutes: async () => 35,
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
    listCompletedSectionSessions: async () => [],
    getScoreRowForRaw: async () => null,
    getScoreRowForScaled: async () => null,
    listPrepTestQuestionsWithMeta: async () => [],
    listAnswerEventsWithTypes: async () => [
      { question_type_id: 't-low', is_correct: true, question_id: 'q-low-1', session_kind: 'DRILL' as const },
      { question_type_id: 't-low', is_correct: false, question_id: 'q-low-2', session_kind: 'DRILL' as const },
      { question_type_id: 't-high', is_correct: false, question_id: 'q-high-1', session_kind: 'DRILL' as const },
      { question_type_id: 't-high', is_correct: false, question_id: 'q-high-2', session_kind: 'DRILL' as const },
      { question_type_id: 't-high', is_correct: false, question_id: 'q-high-3', session_kind: 'DRILL' as const },
    ],
    listAnswerEventsForQuestionType: async () => [],
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
    getUserGoalScore: async () => 165,
    listExcludedSessionIds: async () => new Set<string>(),
    listSessions: async () => [],
    countSessions: async () => 0,
    countAnswerEventsByKind: async () => 0,
    fetchKindSectionAccuracy: async () => [],
    listAnswerEventsForExplanationIndex: async () => [],
    listAdminQuestionsWithExplanationContent: async () => [],
    listQuestionsExplanationMetaByIds: async () => [],
    countAnswerEventsForQuestion: async () => 0,
    getQuestionExplanationPayload: async () => null,
    listStudentVisiblePrepTestIds: async () => ['pt-1', 'pt-900', 'pt-901'],
    resolveQuestionVisibility: async (questionIds: string[]) => {
      const out = new Map<string, boolean>()
      for (const id of questionIds) out.set(id, true)
      return out
    },
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
  assertEquals(o.totalStudyMinutes, 95)
})

Deno.test('getOverview sums practice and lesson study minutes', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      sumCompletedSessionStudyMinutes: async () => 120,
      sumCompletedLessonStudyMinutes: async () => 45,
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.totalStudyMinutes, 165)
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

Deno.test('getOverview uses section session answers for LR/RC misses', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [completedPreptestRow({ id: 's1', prep_test_id: 'pt-1' })],
      listCompletedSectionSessions: async () => [
        {
          id: 'sec-1',
          prep_test_id: 'pt-1',
          section_id: 'section-1',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:30:00Z',
          raw_score: 20,
          metadata: { sectionType: 'LR', questionIds: ['q1', 'q2'] },
        },
      ],
      listAnswerEventsForSessions: async (sessionIds) => {
        if (sessionIds.includes('sec-1')) {
          return [
            answerEvent({
              practice_session_id: 'sec-1',
              question_id: 'q1',
              is_correct: true,
              section_type: 'LR',
              created_at: '2026-01-01T00:00:00Z',
            }),
            answerEvent({
              practice_session_id: 'sec-1',
              question_id: 'q1',
              is_correct: false,
              section_type: 'LR',
              created_at: '2026-01-01T00:05:00Z',
            }),
          ]
        }
        return []
      },
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.averageLrMissedPerPrepTest, 1)
})

Deno.test('getOverview resolves scaled score from raw when scaled_score is null', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [
        completedPreptestRow({
          scaled_score: null,
          percentile: null,
          raw_score: 82,
          prep_test_id: 'pt-1',
        }),
      ],
      getScoreRowForRaw: async () => ({ scaled_score: 168, percentile: 88 }),
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.bestScaledScore, 168)
  assertEquals(o.bestPercentile, 88)
})

Deno.test('getOverview excludes experimental sections from score and percentile', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [
        completedPreptestRow({
          scaled_score: 120,
          percentile: 0,
          raw_score: 40,
          prep_test_id: 'pt-1',
        }),
      ],
      listCompletedSectionSessions: async () => [
        {
          id: 'sec-scored',
          prep_test_id: 'pt-1',
          section_id: 's1',
          started_at: '2025-12-31T01:00:00Z',
          completed_at: '2025-12-31T01:30:00Z',
          raw_score: 20,
          metadata: { sectionType: 'LR' },
          admin_sections: { is_experimental: false },
        },
        {
          id: 'sec-exp',
          prep_test_id: 'pt-1',
          section_id: 's-exp',
          started_at: '2025-12-31T02:00:00Z',
          completed_at: '2025-12-31T02:30:00Z',
          raw_score: 20,
          metadata: { sectionType: 'LR' },
          admin_sections: { is_experimental: true },
        },
      ],
      getScoreRowForRaw: async (_pt, raw) => {
        if (raw === 20) return { scaled_score: 150, percentile: 44 }
        if (raw === 40) return { scaled_score: 120, percentile: 0 }
        return null
      },
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.bestScaledScore, 150)
  assertEquals(o.bestPercentile, 44)
  assertEquals(o.averageScaledScore, 150)
  assertEquals(o.averagePercentile, 44)
})

Deno.test('getOverview average percentile uses conversion for average scaled score', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [
        completedPreptestRow({
          id: 'a',
          scaled_score: 160,
          percentile: 80,
          prep_test_id: 'pt-1',
        }),
        completedPreptestRow({
          id: 'b',
          scaled_score: 140,
          percentile: 20,
          prep_test_id: 'pt-1',
          completed_at: '2026-02-01T00:00:00Z',
        }),
      ],
      getScoreRowForScaled: async (_pt, scaled) => {
        if (scaled === 150) return { scaled_score: 150, percentile: 48 }
        return null
      },
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.averageScaledScore, 150)
  // Not mean of 80 and 20 (=50) — lookup for average scaled 150.
  assertEquals(o.averagePercentile, 48)
})

Deno.test('getOverview falls back to section sessions for LR/RC when preptest events missing', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listCompletedPreptests: async () => [],
      listCompletedSectionSessions: async () => [
        {
          id: 'sec-lr',
          prep_test_id: null,
          section_id: 'section-lr',
          started_at: '2026-01-01T00:00:00Z',
          completed_at: '2026-01-01T00:30:00Z',
          raw_score: 18,
          metadata: { sectionType: 'LR', questionIds: Array.from({ length: 26 }, (_, i) => `q${i}`) },
        },
      ],
      listAnswerEventsForSessions: async () => [],
    }),
  })
  const o = await service.getOverview('user-1')
  assertEquals(o.averageLrMissedPerPrepTest, 8)
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

Deno.test('getPriorities sorts by priorityScore (gap × avg per test) descending', async () => {
  const service = createAnalyticsService({ repository: mockRepo() })
  const { priorities, goalScore, goalAccuracyFromScore: derived } = await service.getPriorities(
    'user-1',
  )
  assertEquals(goalScore, 165)
  assertEquals(derived, 86)
  assertEquals(priorities[0]?.questionTypeId, 't-high')
  assertEquals(priorities[0]?.goalAccuracy, 86)
})

Deno.test('getPriorities suppresses goal/priority when attempts < 3', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-few', is_correct: false, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-few', is_correct: false, question_id: 'q2', session_kind: 'DRILL' },
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
  assertEquals(priorities[0]?.unlocked, false)
  assertEquals(priorities[0]?.goalAccuracy, null)
  assertEquals(priorities[0]?.gap, null)
  assertEquals(priorities[0]?.priorityTier, null)
  assertEquals(priorities[0]?.priorityLevel, 'low')
})

Deno.test('getPriorities derives goalAccuracy from user goal_score (not static type goal)', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => 165,
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-gap', is_correct: true, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-gap', is_correct: true, question_id: 'q2', session_kind: 'DRILL' },
        { question_type_id: 't-gap', is_correct: true, question_id: 'q3', session_kind: 'DRILL' },
        { question_type_id: 't-gap', is_correct: false, question_id: 'q4', session_kind: 'DRILL' },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-gap',
          name: 'Big gap',
          section_type: 'LR',
          goal_accuracy: 90, // ignored when goal_score is set
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  // 75% accuracy vs 86% goal → gap 11; extra correct = 0.11 * 5 = 0.6
  assertEquals(priorities[0]?.accuracyPct, 75)
  assertEquals(priorities[0]?.goalAccuracy, 86)
  assertEquals(priorities[0]?.gap, 11)
  assertEquals(priorities[0]?.extraCorrectNeededPerTest, 0.6)
  assertEquals(priorities[0]?.priorityScore, 55) // 11 * 5
})

Deno.test('getPriorities adjusts goalAccuracy by tag difficulty', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => 180, // base goal 98%
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-easy', is_correct: true, question_id: 'e1', session_kind: 'DRILL' },
        { question_type_id: 't-easy', is_correct: true, question_id: 'e2', session_kind: 'DRILL' },
        { question_type_id: 't-easy', is_correct: true, question_id: 'e3', session_kind: 'DRILL' },
        { question_type_id: 't-hard', is_correct: true, question_id: 'h1', session_kind: 'DRILL' },
        { question_type_id: 't-hard', is_correct: false, question_id: 'h2', session_kind: 'DRILL' },
        { question_type_id: 't-hard', is_correct: false, question_id: 'h3', session_kind: 'DRILL' },
      ],
      listAnswerEventsWithTypeDifficulty: async () => [
        { question_type_id: 't-easy', difficulty: 1 },
        { question_type_id: 't-easy', difficulty: 1 },
        { question_type_id: 't-easy', difficulty: 1 },
        { question_type_id: 't-hard', difficulty: 5 },
        { question_type_id: 't-hard', difficulty: 5 },
        { question_type_id: 't-hard', difficulty: 5 },
      ],
      listQuestionTypesByIds: async () => [
        { id: 't-easy', name: 'Easy', section_type: 'LR', goal_accuracy: null, avg_per_test: 5 },
        { id: 't-hard', name: 'Hard', section_type: 'LR', goal_accuracy: null, avg_per_test: 5 },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  const byId = Object.fromEntries(priorities.map((p) => [p.questionTypeId, p.goalAccuracy]))
  assertEquals(byId['t-easy'], 99) // 98 + 8, clamped
  assertEquals(byId['t-hard'], 86) // 98 - 12
})

Deno.test('getPriorities falls back to question_types.goal_accuracy when no goal_score', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => null,
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-fb', is_correct: true, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-fb', is_correct: true, question_id: 'q2', session_kind: 'DRILL' },
        { question_type_id: 't-fb', is_correct: true, question_id: 'q3', session_kind: 'DRILL' },
        { question_type_id: 't-fb', is_correct: false, question_id: 'q4', session_kind: 'DRILL' },
        { question_type_id: 't-fb', is_correct: false, question_id: 'q5', session_kind: 'DRILL' },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-fb',
          name: 'Fallback',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities, goalAccuracyFromScore: derived } = await service.getPriorities('user-1')
  assertEquals(derived, null)
  assertEquals(priorities[0]?.goalAccuracy, 90)
  assertEquals(priorities[0]?.gap, 30) // 90 - 60
})

Deno.test('getPriorities assigns relative quartile tiers by priorityScore', async () => {
  const mkEvents = (typeId: string, correct: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({
      question_type_id: typeId,
      is_correct: i < correct,
      question_id: `${typeId}-q${i}`,
      session_kind: 'DRILL' as const,
    }))
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => 165, // goal accuracy 86%
      listAnswerEventsWithTypes: async () => [
        ...mkEvents('t-a', 0, 4), // 0% → gap 86 × avg 10 = 860
        ...mkEvents('t-b', 2, 4), // 50% → gap 36 × avg 8 = 288
        ...mkEvents('t-c', 3, 4), // 75% → gap 11 × avg 6 = 66
        ...mkEvents('t-d', 4, 4), // 100% → gap -14 × avg 4 = -56
      ],
      listQuestionTypesByIds: async () => [
        { id: 't-a', name: 'A', section_type: 'LR', goal_accuracy: null, avg_per_test: 10 },
        { id: 't-b', name: 'B', section_type: 'LR', goal_accuracy: null, avg_per_test: 8 },
        { id: 't-c', name: 'C', section_type: 'LR', goal_accuracy: null, avg_per_test: 6 },
        { id: 't-d', name: 'D', section_type: 'LR', goal_accuracy: null, avg_per_test: 4 },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  const byId = Object.fromEntries(priorities.map((p) => [p.questionTypeId, p.priorityTier]))
  assertEquals(byId['t-a'], 'highest')
  assertEquals(byId['t-b'], 'high')
  assertEquals(byId['t-c'], 'medium')
  assertEquals(byId['t-d'], 'low')
  assertEquals(priorities[0]?.priorityLevel, 'high') // legacy: highest → high
})

Deno.test('getPriorities excludes tags with 0 avg_per_test from ranking', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-zero', is_correct: false, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-zero', is_correct: false, question_id: 'q2', session_kind: 'DRILL' },
        { question_type_id: 't-zero', is_correct: false, question_id: 'q3', session_kind: 'DRILL' },
        { question_type_id: 't-ok', is_correct: false, question_id: 'q4', session_kind: 'DRILL' },
        { question_type_id: 't-ok', is_correct: false, question_id: 'q5', session_kind: 'DRILL' },
        { question_type_id: 't-ok', is_correct: false, question_id: 'q6', session_kind: 'DRILL' },
      ],
      listQuestionTypesByIds: async () => [
        { id: 't-zero', name: 'Zero avg', section_type: 'LR', goal_accuracy: null, avg_per_test: 0 },
        { id: 't-ok', name: 'Ok', section_type: 'LR', goal_accuracy: null, avg_per_test: 5 },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities.find((p) => p.questionTypeId === 't-zero')?.priorityTier, null)
  assertEquals(priorities.find((p) => p.questionTypeId === 't-ok')?.priorityTier, 'highest')
})

Deno.test('getPriorities filters by includeKinds', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-k', is_correct: true, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-k', is_correct: false, question_id: 'q2', session_kind: 'SECTION' },
        { question_type_id: 't-k', is_correct: false, question_id: 'q3', session_kind: 'SECTION' },
        { question_type_id: 't-k', is_correct: false, question_id: 'q4', session_kind: 'SECTION' },
      ],
      listQuestionTypesByIds: async () => [
        { id: 't-k', name: 'Kinds', section_type: 'LR', goal_accuracy: null, avg_per_test: 5 },
      ],
    }),
  })
  const all = await service.getPriorities('user-1')
  assertEquals(all.priorities[0]?.attemptCount, 4)
  const drillsOnly = await service.getPriorities('user-1', { includeKinds: ['DRILL'] })
  assertEquals(drillsOnly.priorities[0]?.attemptCount, 1)
  assertEquals(drillsOnly.priorities[0]?.unlocked, false)
})

Deno.test('getPriorities averages difficulty events per type', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-diff', is_correct: true, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-diff', is_correct: true, question_id: 'q2', session_kind: 'DRILL' },
        { question_type_id: 't-diff', is_correct: true, question_id: 'q3', session_kind: 'DRILL' },
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

Deno.test('getPriorities tie-breaks equal priorityScore by attempt count', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => null,
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-a', is_correct: false, question_id: 'qa1', session_kind: 'DRILL' },
        { question_type_id: 't-a', is_correct: false, question_id: 'qa2', session_kind: 'DRILL' },
        { question_type_id: 't-a', is_correct: false, question_id: 'qa3', session_kind: 'DRILL' },
        { question_type_id: 't-b', is_correct: false, question_id: 'qb1', session_kind: 'DRILL' },
        { question_type_id: 't-b', is_correct: false, question_id: 'qb2', session_kind: 'DRILL' },
        { question_type_id: 't-b', is_correct: false, question_id: 'qb3', session_kind: 'DRILL' },
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
  // Equal gap and avg → equal priorityScore; both unlocked with 3 attempts
  assertEquals(priorities[0]?.priorityScore, priorities[1]?.priorityScore)
  assertEquals(priorities[0]?.attemptCount, 3)
  assertEquals(priorities[1]?.attemptCount, 3)
})

Deno.test('getPriorities uses Unknown type when metadata missing', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getUserGoalScore: async () => null,
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 'orphan', is_correct: false, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 'orphan', is_correct: false, question_id: 'q2', session_kind: 'DRILL' },
        { question_type_id: 'orphan', is_correct: false, question_id: 'q3', session_kind: 'DRILL' },
      ],
      listQuestionTypesByIds: async () => [],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.name, 'Unknown type')
  assertEquals(priorities[0]?.goalAccuracy, null)
})

Deno.test('getPriorities reviewCount counts unique questions', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsWithTypes: async () => [
        { question_type_id: 't-dup', is_correct: false, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-dup', is_correct: true, question_id: 'q1', session_kind: 'DRILL' },
        { question_type_id: 't-dup', is_correct: false, question_id: 'q2', session_kind: 'DRILL' },
      ],
      listQuestionTypesByIds: async () => [
        {
          id: 't-dup',
          name: 'Dup type',
          section_type: 'LR',
          goal_accuracy: 90,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.attemptCount, 3)
  assertEquals(priorities[0]?.reviewCount, 2)
})

// --- getQuestionTypeReview ---

Deno.test('getQuestionTypeReview returns empty attempts for unknown type', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsForQuestionType: async () => [],
      listQuestionTypesByIds: async () => [
        {
          id: 't-empty',
          name: 'Empty type',
          section_type: 'LR',
          goal_accuracy: 85,
          avg_per_test: 4,
        },
      ],
    }),
  })
  const out = await service.getQuestionTypeReview('user-1', 't-empty')
  assertEquals(out.questionTypeId, 't-empty')
  assertEquals(out.name, 'Empty type')
  assertEquals(out.attemptCount, 0)
  assertEquals(out.correctCount, 0)
  assertEquals(out.attempts.length, 0)
})

Deno.test('getQuestionTypeReview keeps latest attempt per question', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listAnswerEventsForQuestionType: async () => [
        {
          id: 'ae-2',
          question_id: 'q1',
          practice_session_id: 'sess-2',
          is_correct: true,
          selected_answer: 'B',
          difficulty: 3,
          section_type: 'LR' as const,
          session_kind: 'DRILL' as const,
          created_at: '2026-02-01T00:00:00Z',
        },
        {
          id: 'ae-1',
          question_id: 'q1',
          practice_session_id: 'sess-1',
          is_correct: false,
          selected_answer: 'A',
          difficulty: 3,
          section_type: 'LR' as const,
          session_kind: 'DRILL' as const,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'ae-3',
          question_id: 'q2',
          practice_session_id: 'sess-3',
          is_correct: false,
          selected_answer: 'C',
          difficulty: 2,
          section_type: 'LR' as const,
          session_kind: 'SECTION' as const,
          created_at: '2026-01-15T00:00:00Z',
        },
      ],
      listQuestionsExplanationMetaByIds: async (ids) =>
        ids.map((id) => ({
          id,
          question_number: id === 'q1' ? 4 : 7,
          explanation: null,
          video_url: null,
          question_types: { name: 'Flaw' },
          admin_sections: {
            section_type: 'LR' as const,
            section_number: 2,
            admin_prep_tests: { title: 'PrepTest 101', module_id: 'LSAC101' },
          },
        })),
      listQuestionTypesByIds: async () => [
        {
          id: 't-flaw',
          name: 'Flaw',
          section_type: 'LR',
          goal_accuracy: 85,
          avg_per_test: 6,
        },
      ],
    }),
  })
  const out = await service.getQuestionTypeReview('user-1', 't-flaw')
  assertEquals(out.attemptCount, 2)
  assertEquals(out.correctCount, 1)
  assertEquals(out.attempts.length, 2)
  assertEquals(out.attempts[0]?.questionId, 'q1')
  assertEquals(out.attempts[0]?.isCorrect, true)
  assertEquals(out.attempts[0]?.selectedAnswer, 'B')
  assertEquals(out.attempts[0]?.title, 'PT 101  .  S2  .  Q4')
  assertEquals(out.attempts[1]?.questionId, 'q2')
  assertEquals(out.attempts[1]?.isCorrect, false)
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

Deno.test('getSessions enriches drill metadata with questionTypeName', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      listSessions: async () => [
        sessionListRow({
          kind: 'DRILL',
          prep_test_id: null,
          admin_prep_tests: null,
          admin_sections: null,
          metadata: {
            sectionType: 'LR',
            questionTypeId: 't-high',
            questionIds: ['q1'],
          },
        }),
      ],
      countSessions: async () => 1,
      listQuestionTypesByIds: async () => [
        {
          id: 't-high',
          name: 'Main Conclusion',
          section_type: 'LR',
          goal_accuracy: 86,
          avg_per_test: 5,
        },
      ],
    }),
  })
  const out = await service.getSessions('user-1', {
    kind: 'DRILL',
    limit: 20,
    offset: 0,
  })
  assertEquals(out.sessions[0]?.metadata.questionTypeName, 'Main Conclusion')
  assertEquals(out.sessions[0]?.sectionType, 'LR')
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
  assertEquals(d.questions.every((q) => q.isExperimental === false), true)
})

Deno.test('getPrepTestSessionDetail excludes experimental sections from score totals', async () => {
  const service = createAnalyticsService({
    repository: mockRepo({
      getPracticeSession: async () => prepTestSessionFixture(),
      listSectionSessionsForPrepTest: async () => [
        { id: 'sec-s1', section_id: 's1', completed_at: PREP_TEST_COMPLETED_AT, raw_score: 1 },
        { id: 'sec-s-exp', section_id: 's-exp', completed_at: PREP_TEST_COMPLETED_AT, raw_score: 1 },
      ],
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
          practice_session_id: 'sec-s-exp',
          question_id: 'q-exp-1',
          is_correct: true,
          selected_answer: 'A',
          section_type: 'LR',
          created_at: '2026-01-01T11:30:00Z',
        },
      ],
      listPrepTestQuestionsWithMeta: async () => [
        prepTestQuestion({ id: 'q-lr-1' }),
        prepTestQuestion({
          id: 'q-exp-1',
          question_number: 1,
          admin_sections: { section_type: 'LR', section_number: 4, is_experimental: true },
        }),
      ],
    }),
  })
  const d = await service.getPrepTestSessionDetail('user-1', 'pt-session-1')
  assertEquals(d.correct, 1)
  assertEquals(d.incorrect, 0)
  assertEquals(d.totalQuestions, 1)
  assertEquals(d.questions.length, 2)
  assertEquals(d.questions.find((q) => q.id === 'q-exp-1')?.isExperimental, true)
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
