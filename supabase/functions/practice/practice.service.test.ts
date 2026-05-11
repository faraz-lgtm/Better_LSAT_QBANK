import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import type { AnswerEventRow, PracticeSessionRow, QuestionDetailRow } from './practice.repository.ts'
import { createPracticeService, PracticeForbiddenError, PracticeValidationError } from './practice.service.ts'

function baseSession(overrides: Partial<PracticeSessionRow> = {}): PracticeSessionRow {
  return {
    id: 'sess-1',
    user_id: 'user-1',
    kind: 'PREPTEST',
    prep_test_id: 'pt-1',
    section_id: null,
    started_at: '2026-01-01T00:00:00Z',
    completed_at: null,
    raw_score: null,
    scaled_score: null,
    percentile: null,
    bookmarked: false,
    excluded: false,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function mockRepo() {
  return {
    insertSession: async () => baseSession(),
    getSessionById: async (_sessionId: string, _userId: string) => baseSession({ completed_at: null }),
    getSectionPrepTestId: async () => 'pt-1',
    getPrepTestExists: async () => true,
    getSectionExists: async () => true,
    getQuestionDetail: async () =>
      ({
        id: 'q-1',
        correct_answer: 'C',
        difficulty: 2,
        question_type_id: null,
        section_id: 'sec-1',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-1' },
      }) satisfies QuestionDetailRow,
    insertAnswerEvent: async (input: { isCorrect: boolean }) =>
      ({
        id: 'ev-1',
        user_id: 'user-1',
        practice_session_id: 'sess-1',
        question_id: 'q-1',
        selected_answer: 'C',
        is_correct: input.isCorrect,
        question_type_id: null,
        section_type: 'LR',
        difficulty: 2,
        session_kind: 'PREPTEST' as const,
        created_at: '2026-01-01T00:00:00Z',
      }) satisfies AnswerEventRow,
    listAnswerEventsForSession: async () =>
      [
        {
          id: 'e1',
          user_id: 'user-1',
          practice_session_id: 'sess-1',
          question_id: 'q-1',
          selected_answer: 'B',
          is_correct: false,
          question_type_id: 'qt-1',
          section_type: 'LR',
          difficulty: 2,
          session_kind: 'PREPTEST' as const,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'e2',
          user_id: 'user-1',
          practice_session_id: 'sess-1',
          question_id: 'q-1',
          selected_answer: 'C',
          is_correct: true,
          question_type_id: 'qt-1',
          section_type: 'LR',
          difficulty: 2,
          session_kind: 'PREPTEST' as const,
          created_at: '2026-01-01T00:01:00Z',
        },
      ] as AnswerEventRow[],
    updateSession: async (_id: string, _uid: string, patch: Record<string, unknown>) =>
      baseSession({
        ...patch,
        completed_at: (patch.completed_at as string | null) ?? null,
        raw_score: (patch.raw_score as number | null) ?? null,
        scaled_score: (patch.scaled_score as number | null) ?? null,
        percentile: (patch.percentile as number | null) ?? null,
      }),
    getScoreRowForRaw: async () => ({ scaled_score: 170, percentile: 90 }),
  }
}

Deno.test('createSession rejects PREPTEST without prepTestId', async () => {
  const service = createPracticeService({ repository: mockRepo() as never })
  await assertRejects(
    () => service.createSession('user-1', { kind: 'PREPTEST' }),
    PracticeValidationError,
  )
})

Deno.test('submitAnswer marks incorrect when choice wrong', async () => {
  let captured: boolean | null = null
  const base = mockRepo()
  const repo = {
    ...base,
    insertAnswerEvent: async (input: { isCorrect: boolean }) => {
      captured = input.isCorrect
      return base.insertAnswerEvent(input)
    },
  }
  const service = createPracticeService({ repository: repo as never })
  await service.submitAnswer('user-1', {
    sessionId: 'sess-1',
    questionId: 'q-1',
    selectedAnswer: 'A',
  })
  assertEquals(captured, false)
})

Deno.test('submitAnswer rejects completed session', async () => {
  const repo = {
    ...mockRepo(),
    getSessionById: async () => baseSession({ completed_at: '2026-01-02T00:00:00Z' }),
  }
  const service = createPracticeService({ repository: repo as never })
  await assertRejects(
    () =>
      service.submitAnswer('user-1', {
        sessionId: 'sess-1',
        questionId: 'q-1',
        selectedAnswer: 'C',
      }),
    PracticeValidationError,
  )
})

Deno.test('completeSession uses latest answer per question for raw score', async () => {
  const service = createPracticeService({ repository: mockRepo() as never })
  const out = await service.completeSession('user-1', { sessionId: 'sess-1' })
  assertEquals(out.session.raw_score, 1)
  assertEquals(out.session.scaled_score, 170)
})

Deno.test('updateSession missing flags throws', async () => {
  const service = createPracticeService({ repository: mockRepo() as never })
  await assertRejects(
    () => service.updateSession('user-1', { sessionId: 'sess-1' }),
    PracticeValidationError,
  )
})

Deno.test('submitAnswer not found session is forbidden', async () => {
  const repo = {
    ...mockRepo(),
    getSessionById: async () => null,
  }
  const service = createPracticeService({ repository: repo as never })
  await assertRejects(
    () =>
      service.submitAnswer('user-1', {
        sessionId: 'sess-1',
        questionId: 'q-1',
        selectedAnswer: 'C',
      }),
    PracticeForbiddenError,
  )
})
