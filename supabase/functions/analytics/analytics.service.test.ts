import { assertEquals } from 'jsr:@std/assert@1'
import type { AnalyticsRepository } from './analytics.repository.ts'
import { createAnalyticsService } from './analytics.service.ts'

function mockRepo(overrides: Partial<AnalyticsRepository> = {}): AnalyticsRepository {
  const base: AnalyticsRepository = {
    countAnswerEvents: async () => 10,
    countDrillAnswerEvents: async () => ({ correct: 7, total: 10 }),
    listCompletedPreptests: async () => [
      {
        id: 's1',
        completed_at: '2026-01-01T00:00:00Z',
        raw_score: 85,
        scaled_score: 170,
        percentile: 90,
        prep_test_id: 'pt-1',
        admin_prep_tests: { title: 'PT A', module_id: 'LSAC900' },
      },
      {
        id: 's2',
        completed_at: '2026-02-01T00:00:00Z',
        raw_score: 80,
        scaled_score: 165,
        percentile: 80,
        prep_test_id: 'pt-1',
        admin_prep_tests: { title: 'PT B', module_id: 'LSAC901' },
      },
    ],
    listAnswerEventsForSessions: async () => [
      {
        practice_session_id: 's1',
        question_id: 'q1',
        is_correct: false,
        section_type: 'LR',
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        practice_session_id: 's1',
        question_id: 'q1',
        is_correct: true,
        section_type: 'LR',
        created_at: '2026-01-01T00:01:00Z',
      },
      {
        practice_session_id: 's1',
        question_id: 'q2',
        is_correct: false,
        section_type: 'RC',
        created_at: '2026-01-01T00:02:00Z',
      },
    ],
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
            }
          : {
              id: 't-low',
              name: 'Easy type',
              section_type: 'LR' as const,
              goal_accuracy: 85,
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
  return base
}

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

Deno.test('getPriorities sorts by gap descending', async () => {
  const service = createAnalyticsService({ repository: mockRepo() })
  const { priorities } = await service.getPriorities('user-1')
  assertEquals(priorities[0]?.questionTypeId, 't-high')
})

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
