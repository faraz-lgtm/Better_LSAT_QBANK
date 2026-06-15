import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import type {
  AnswerEventRow,
  DrillPoolQuestionRow,
  PracticeSessionRow,
  PrepTestDetailRow,
  PrepTestPoolRow,
  QuestionDetailRow,
  SectionPoolRow,
} from './practice.repository.ts'
import type { DrillQuestionRow } from './practice.mapper.ts'
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
    blind_review_raw_score: null,
    blind_review_scaled_score: null,
    blind_review_percentile: null,
    blind_review_completed_at: null,
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

Deno.test('completeSession is idempotent when session already completed', async () => {
  const repo = {
    ...mockRepo(),
    getSessionById: async () => baseSession({ completed_at: '2026-01-02T00:00:00Z', raw_score: 3 }),
  }
  const service = createPracticeService({ repository: repo as never })
  const out = await service.completeSession('user-1', { sessionId: 'sess-1' })
  assertEquals(out.session.raw_score, 3)
  assertEquals(out.session.completed_at, '2026-01-02T00:00:00Z')
})

Deno.test('updateSession missing flags throws', async () => {
  const service = createPracticeService({ repository: mockRepo() as never })
  await assertRejects(
    () => service.updateSession('user-1', { sessionId: 'sess-1' }),
    PracticeValidationError,
  )
})

Deno.test('updateSession stores flaggedQuestionIds in metadata', async () => {
  let captured: { metadata?: Record<string, unknown> } | null = null
  const repo = {
    ...mockRepo(),
    getSessionById: async () =>
      baseSession({
        kind: 'DRILL',
        prep_test_id: null,
        metadata: { questionIds: ['q-1', 'q-2'] },
      }),
    updateSession: async (_id: string, _uid: string, patch: Record<string, unknown>) => {
      captured = { metadata: patch.metadata as Record<string, unknown> | undefined }
      return baseSession({
        kind: 'DRILL',
        metadata: (patch.metadata as Record<string, unknown>) ?? {},
      })
    },
  }
  const service = createPracticeService({ repository: repo as never })
  await service.updateSession('user-1', {
    sessionId: 'sess-1',
    flaggedQuestionIds: ['q-2'],
  })
  assertEquals(captured!.metadata, { questionIds: ['q-1', 'q-2'], flaggedQuestionIds: ['q-2'] })
})

Deno.test('updateSession rejects flaggedQuestionIds not in session', async () => {
  const repo = {
    ...mockRepo(),
    getSessionById: async () =>
      baseSession({
        kind: 'DRILL',
        prep_test_id: null,
        metadata: { questionIds: ['q-1'] },
      }),
  }
  const service = createPracticeService({ repository: repo as never })
  await assertRejects(
    () =>
      service.updateSession('user-1', {
        sessionId: 'sess-1',
        flaggedQuestionIds: ['q-other'],
      }),
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

Deno.test('submitAnswer rejects question not in drill session', async () => {
  const repo = {
    ...mockRepo(),
    getSessionById: async () =>
      baseSession({
        kind: 'DRILL',
        prep_test_id: null,
        metadata: { questionIds: ['q-allowed'] },
      }),
    getQuestionDetail: async () =>
      ({
        id: 'q-other',
        correct_answer: 'A',
        difficulty: 2,
        question_type_id: null,
        section_id: 'sec-1',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-1' },
      }) satisfies QuestionDetailRow,
  }
  const service = createPracticeService({ repository: repo as never })
  await assertRejects(
    () =>
      service.submitAnswer('user-1', {
        sessionId: 'sess-1',
        questionId: 'q-other',
        selectedAnswer: 'A',
      }),
    PracticeValidationError,
  )
})

const drillPool: DrillPoolQuestionRow[] = [
  { id: 'q-1', section_id: 's1', source_group_id: null, difficulty: 2, question_type_id: null },
  { id: 'q-2', section_id: 's1', source_group_id: null, difficulty: 3, question_type_id: null },
]

const drillQuestionRow: DrillQuestionRow = {
  id: 'q-1',
  question_number: 1,
  source_group_id: null,
  stimulus_text: 'Stimulus',
  stem_text: 'Stem?',
  choices: ['A', 'B', 'C'],
  admin_sections: {
    id: 's1',
    section_type: 'LR',
    section_number: 1,
    title: 'LR',
    admin_passages: [],
  },
}

function drillRepo(overrides: Record<string, unknown> = {}) {
  return {
    ...mockRepo(),
    listDrillPoolQuestions: async () => drillPool,
    listUserAnsweredQuestionIds: async () => [],
    getDrillQuestionRowsByIds: async (ids: string[]) =>
      ids.map((id) => ({ ...drillQuestionRow, id })),
    insertSession: async (input: { metadata: Record<string, unknown> }) =>
      baseSession({
        kind: 'DRILL',
        prep_test_id: null,
        metadata: input.metadata,
      }),
    ...overrides,
  }
}

Deno.test('startLessonDrill creates session with lesson metadata', async () => {
  const service = createPracticeService({
    repository: drillRepo({
      getPublishedPrepLessonById: async () => ({
        id: 'lesson-1',
        title: 'Active Drill Lesson',
        lesson_type: 'active_drill',
        summary: 'This Active Drill will be PT102.S2.Q1.',
        text_content: null,
        is_published: true,
      }),
      listLessonQuestionIds: async () => ['q-1'],
      getQuestionDetail: async () => ({
        id: 'q-1',
        correct_answer: 'A',
        difficulty: 2,
        question_type_id: null,
        section_id: 's1',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-1' },
      }),
    }) as never,
  })
  const out = await service.startLessonDrill('user-1', { lessonId: 'lesson-1' })
  assertEquals(out.session.kind, 'DRILL')
  assertEquals(out.metadata.lessonId, 'lesson-1')
  assertEquals(out.metadata.source, 'prep_course_active_drill')
  assertEquals(out.metadata.questionIds, ['q-1'])
})

Deno.test('startLessonDrill resolves question from PT reference when not linked', async () => {
  const service = createPracticeService({
    repository: drillRepo({
      getPublishedPrepLessonById: async () => ({
        id: 'lesson-1',
        title: 'Active Drill',
        lesson_type: 'active_drill',
        summary: 'This Active Drill will be PT133.S2.Q5.',
        text_content: null,
        is_published: true,
      }),
      listLessonQuestionIds: async () => [],
      resolveQuestionIdFromReference: async (ref: string) => {
        assertEquals(ref, 'PT133.S2.Q5')
        return 'q-133'
      },
      getQuestionDetail: async () => ({
        id: 'q-133',
        correct_answer: 'A',
        difficulty: 2,
        question_type_id: null,
        section_id: 's1',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-1' },
      }),
      getDrillQuestionRowsByIds: async (ids: string[]) =>
        ids.map((id) => ({ ...drillQuestionRow, id })),
    }) as never,
  })
  const out = await service.startLessonDrill('user-1', { lessonId: 'lesson-1' })
  assertEquals(out.metadata.questionIds, ['q-133'])
})

Deno.test('startLessonDrill creates adaptive drill session with multiple questions', async () => {
  const service = createPracticeService({
    repository: drillRepo({
      getPublishedPrepLessonById: async () => ({
        id: 'lesson-adaptive',
        title: 'Adaptive Drill - Mixed Practice (5 Qs)',
        lesson_type: 'adaptive_drill',
        summary: 'Mixed practice.',
        text_content: null,
        is_published: true,
      }),
      listLessonQuestionIds: async () => ['q-1', 'q-2', 'q-3'],
      getQuestionDetail: async () => ({
        id: 'q-1',
        correct_answer: 'A',
        difficulty: 2,
        question_type_id: null,
        section_id: 's1',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-1' },
      }),
      getDrillQuestionRowsByIds: async (ids: string[]) =>
        ids.map((id) => ({ ...drillQuestionRow, id })),
    }) as never,
  })
  const out = await service.startLessonDrill('user-1', { lessonId: 'lesson-adaptive' })
  assertEquals(out.metadata.source, 'prep_course_adaptive_drill')
  assertEquals(out.metadata.questionIds, ['q-1', 'q-2', 'q-3'])
  assertEquals(out.metadata.questionCount, 3)
})

Deno.test('startLessonDrill rejects non-active-drill lessons', async () => {
  const service = createPracticeService({
    repository: drillRepo({
      getPublishedPrepLessonById: async () => ({
        id: 'lesson-1',
        title: 'Video',
        lesson_type: 'video_text',
        summary: null,
        text_content: null,
        is_published: true,
      }),
    }) as never,
  })
  await assertRejects(
    () => service.startLessonDrill('user-1', { lessonId: 'lesson-1' }),
    PracticeValidationError,
    'Lesson is not a prep-course drill',
  )
})

Deno.test('startDrill creates session with question ids', async () => {
  const service = createPracticeService({ repository: drillRepo() as never })
  const out = await service.startDrill('user-1', {
    sectionType: 'LR',
    questionCount: 1,
  })
  assertEquals(out.session.kind, 'DRILL')
  assertEquals(out.metadata.questionIds.length, 1)
  assertEquals(out.questions.length, 1)
  assertEquals(out.questions[0]!.stemText, 'Stem?')
})

Deno.test('getDrillPoolStats fresh filter reduces selected count', async () => {
  const service = createPracticeService({
    repository: drillRepo({
      listUserAnsweredQuestionIds: async () => ['q-1'],
    }) as never,
  })
  const stats = await service.getDrillPoolStats('user-1', {
    sectionType: 'LR',
    status: 'fresh',
  })
  assertEquals(stats.totalCount, 2)
  assertEquals(stats.selectedCount, 1)
})

const sectionPoolRows: SectionPoolRow[] = [
  {
    id: 'sec-db-1',
    sectionId: 'SEED900-LR-1',
    sectionNumber: 1,
    sectionType: 'LR',
    title: 'Logical Reasoning',
    moduleId: 'LSAC900',
    prepTestId: 'pt-900',
    prepTestTitle: 'Local Seed — PrepTest Alpha',
    questionCount: 3,
  },
  {
    id: 'sec-db-2',
    sectionId: 'SEED900-RC-1',
    sectionNumber: 2,
    sectionType: 'RC',
    title: 'Reading Comprehension',
    moduleId: 'LSAC900',
    prepTestId: 'pt-900',
    prepTestTitle: 'Local Seed — PrepTest Alpha',
    questionCount: 2,
  },
  {
    id: 'sec-db-3',
    sectionId: 'SEED901-LR-1',
    sectionNumber: 1,
    sectionType: 'LR',
    title: 'Logical Reasoning',
    moduleId: 'LSAC901',
    prepTestId: 'pt-901',
    prepTestTitle: 'Local Seed — PrepTest Beta',
    questionCount: 1,
  },
]

function sectionRepo(overrides: Record<string, unknown> = {}) {
  return {
    ...mockRepo(),
    listSectionPoolRows: async () => sectionPoolRows,
    getSectionDetail: async (sectionId: string) => {
      if (sectionId === 'sec-db-1') {
        return {
          id: 'sec-db-1',
          section_id: 'SEED900-LR-1',
          section_number: 1,
          section_type: 'LR' as const,
          title: 'Logical Reasoning',
          module_id: 'LSAC900',
          prep_test_id: 'pt-900',
          admin_prep_tests: { id: 'pt-900', title: 'Local Seed — PrepTest Alpha', module_id: 'LSAC900' },
        }
      }
      return null
    },
    listQuestionIdsBySectionId: async () => ['q-1', 'q-2', 'q-3'],
    getDrillQuestionRowsByIds: async (ids: string[]) =>
      ids.map((id) => ({ ...drillQuestionRow, id })),
    insertSession: async (input: { metadata: Record<string, unknown>; sectionId?: string }) =>
      baseSession({
        kind: 'SECTION',
        section_id: input.sectionId ?? 'sec-db-1',
        prep_test_id: 'pt-900',
        metadata: input.metadata,
      }),
    ...overrides,
  }
}

Deno.test('listSectionPool returns LR and RC sections with counts', async () => {
  const service = createPracticeService({ repository: sectionRepo() as never })
  const out = await service.listSectionPool('user-1', {})
  assertEquals(out.sections.length, 3)
  assertEquals(out.total, 3)
  assertEquals(out.page, 1)
  assertEquals(out.pageSize, 12)
  assertEquals(out.sectionTypeCounts.all, 3)
  assertEquals(out.sectionTypeCounts.lr, 2)
  assertEquals(out.sectionTypeCounts.rc, 1)
  assertEquals(out.sections[0]!.sectionType, 'LR')
  assertEquals(out.sections[0]!.moduleId, 'LSAC901')
  assertEquals(out.sections[0]!.questionCount, 1)
  assertEquals(out.sections[0]!.timeMinutes, 35)
})

Deno.test('listSectionPool paginates and filters by section type', async () => {
  const service = createPracticeService({ repository: sectionRepo() as never })
  const page1 = await service.listSectionPool('user-1', { page: 1, pageSize: 1, sort: 'newest' })
  assertEquals(page1.total, 3)
  assertEquals(page1.sections.length, 1)
  assertEquals(page1.sections[0]!.id, 'sec-db-3')

  const page2 = await service.listSectionPool('user-1', { page: 2, pageSize: 1, sort: 'newest' })
  assertEquals(page2.sections[0]!.id, 'sec-db-2')

  const lrOnly = await service.listSectionPool('user-1', { sectionType: 'LR' })
  assertEquals(lrOnly.total, 2)
  assertEquals(lrOnly.sections.every((s) => s.sectionType === 'LR'), true)
  assertEquals(lrOnly.sectionTypeCounts.lr, 2)
})

Deno.test('startSection creates session with all section questions', async () => {
  const service = createPracticeService({ repository: sectionRepo() as never })
  const out = await service.startSection('user-1', { sectionId: 'sec-db-1' })
  assertEquals(out.session.kind, 'SECTION')
  assertEquals(out.metadata.questionIds, ['q-1', 'q-2', 'q-3'])
  assertEquals(out.questions.length, 3)
  assertEquals(out.section.sectionType, 'LR')
})

Deno.test('getSectionSession returns questions and resume answers', async () => {
  const service = createPracticeService({
    repository: sectionRepo({
      getSessionById: async () =>
        baseSession({
          kind: 'SECTION',
          section_id: 'sec-db-1',
          prep_test_id: 'pt-900',
          metadata: {
            sectionType: 'LR',
            timing: '35',
            showAnswers: 'end',
            questionIds: ['q-1', 'q-2'],
            prepTestTitle: 'Local Seed — PrepTest Alpha',
            sectionTitle: 'Logical Reasoning',
          },
        }),
    }) as never,
  })
  const out = await service.getSectionSession('user-1', { sessionId: 'sess-1' })
  assertEquals(out.questions.length, 2)
  assertEquals(out.answers.length, 1)
  assertEquals(out.answers[0]!.selectedAnswer, 'C')
})

const prepTestPoolRows: PrepTestPoolRow[] = [
  {
    id: 'pt-900',
    moduleId: 'LSAC900',
    title: 'Local Seed — PrepTest Alpha',
    sections: [
      { id: 'sec-lr', sectionType: 'LR', questionCount: 3 },
      { id: 'sec-rc', sectionType: 'RC', questionCount: 2 },
      { id: 'sec-lg', sectionType: 'LG', questionCount: 1 },
    ],
  },
  {
    id: 'pt-901',
    moduleId: 'LSAC901',
    title: 'Local Seed — PrepTest Beta',
    sections: [
      { id: 'sec-lr-2', sectionType: 'LR', questionCount: 1 },
      { id: 'sec-rc-2', sectionType: 'RC', questionCount: 1 },
    ],
  },
]

const prepTestDetailRow: PrepTestDetailRow = {
  id: 'pt-900',
  moduleId: 'LSAC900',
  title: 'Local Seed — PrepTest Alpha',
  sections: [
    {
      id: 'sec-lr',
      sectionId: 'SEED900-LR-1',
      sectionNumber: 1,
      sectionType: 'LR',
      title: 'Logical Reasoning',
      questionCount: 3,
    },
    {
      id: 'sec-rc',
      sectionId: 'SEED900-RC-1',
      sectionNumber: 2,
      sectionType: 'RC',
      title: 'Reading Comprehension',
      questionCount: 2,
    },
    {
      id: 'sec-lg',
      sectionId: 'SEED900-LG-1',
      sectionNumber: 3,
      sectionType: 'LG',
      title: 'Analytical Reasoning',
      questionCount: 1,
    },
  ],
}

function preptestRepo(overrides: Record<string, unknown> = {}) {
  return {
    ...mockRepo(),
    listPrepTestPoolRows: async () => prepTestPoolRows,
    getPrepTestDetailRow: async (id: string) => (id === 'pt-900' ? prepTestDetailRow : null),
    listUserSessionsForPrepTest: async () => [] as PracticeSessionRow[],
    listUserSessionsForPrepTests: async () => [] as PracticeSessionRow[],
    insertSession: async (input: { kind: string; prepTestId: string | null; metadata: Record<string, unknown> }) =>
      baseSession({
        kind: input.kind as 'PREPTEST',
        prep_test_id: input.prepTestId,
        metadata: input.metadata,
      }),
    ...overrides,
  }
}

Deno.test('listPrepTestPool returns practiceable prep tests with fresh status', async () => {
  const service = createPracticeService({ repository: preptestRepo() as never })
  const out = await service.listPrepTestPool('user-1', {})
  assertEquals(out.prepTests.length, 2)
  assertEquals(out.total, 2)
  assertEquals(out.page, 1)
  assertEquals(out.pageSize, 10)
  assertEquals(out.statusCounts.all, 2)
  assertEquals(out.statusCounts.fresh, 2)
  assertEquals(out.prepTests[0]!.id, 'pt-901')
  assertEquals(out.prepTests[0]!.status, 'fresh')
  assertEquals(out.prepTests[1]!.id, 'pt-900')
  assertEquals(out.prepTests[1]!.practiceableSectionCount, 2)
  assertEquals(out.prepTests[1]!.questionCount, 5)
})

Deno.test('listPrepTestPool prefers awaiting blind review over a newer open prep test session', async () => {
  const completedAwaitingBr = baseSession({
    id: 'pt-sess-done',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-03T00:00:00Z',
    scaled_score: 162,
    metadata: { blindReviewActive: true },
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => [
        baseSession({
          id: 'pt-sess-open',
          kind: 'PREPTEST',
          prep_test_id: 'pt-900',
          started_at: '2026-01-04T00:00:00Z',
          completed_at: null,
        }),
        completedAwaitingBr,
      ],
      listUserSessionsForPrepTest: async () => [
        baseSession({
          id: 'pt-sess-open',
          kind: 'PREPTEST',
          prep_test_id: 'pt-900',
          started_at: '2026-01-04T00:00:00Z',
          completed_at: null,
        }),
        completedAwaitingBr,
      ],
    }) as never,
  })
  const out = await service.listPrepTestPool('user-1', {})
  const row = out.prepTests.find((p) => p.id === 'pt-900')
  assertEquals(row?.status, 'in_progress')
  assertEquals(row?.blindReviewStatus, 'in_progress')
  assertEquals(row?.scaledScore, 162)
})

Deno.test('listPrepTestPool shows completed when latest attempt finished blind review', async () => {
  const olderAwaitingBr = baseSession({
    id: 'pt-sess-old-br',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    started_at: '2026-01-01T00:00:00Z',
    completed_at: '2026-01-02T00:00:00Z',
    scaled_score: 150,
    metadata: { blindReviewActive: true },
  })
  const newerBrComplete = baseSession({
    id: 'pt-sess-new-done',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    started_at: '2026-01-10T00:00:00Z',
    completed_at: '2026-01-10T00:00:00Z',
    scaled_score: 158,
    blind_review_scaled_score: 162,
    blind_review_completed_at: '2026-01-11T00:00:00Z',
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => [newerBrComplete, olderAwaitingBr],
      listUserSessionsForPrepTest: async () => [newerBrComplete, olderAwaitingBr],
    }) as never,
  })
  const out = await service.listPrepTestPool('user-1', {})
  const row = out.prepTests.find((p) => p.id === 'pt-900')
  assertEquals(row?.status, 'completed')
  assertEquals(row?.blindReviewStatus, null)
  assertEquals(row?.scaledScore, 158)
  assertEquals(row?.blindReviewScaledScore, 162)
})

Deno.test('listPrepTestPool paginates and uses batch sessions query', async () => {
  let batchCalls = 0
  let perTestCalls = 0
  const completedPt = baseSession({
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-02T00:00:00Z',
    scaled_score: 170,
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => {
        batchCalls += 1
        return [completedPt]
      },
      listUserSessionsForPrepTest: async () => {
        perTestCalls += 1
        return []
      },
    }) as never,
  })
  const page1 = await service.listPrepTestPool('user-1', { page: 1, pageSize: 1, sort: 'newest' })
  assertEquals(batchCalls, 1)
  assertEquals(perTestCalls, 0)
  assertEquals(page1.total, 2)
  assertEquals(page1.prepTests.length, 1)
  assertEquals(page1.prepTests[0]!.id, 'pt-901')
  assertEquals(page1.statusCounts.in_progress, 1)
  assertEquals(page1.statusCounts.fresh, 1)

  const page2 = await service.listPrepTestPool('user-1', { page: 2, pageSize: 1, sort: 'newest' })
  assertEquals(page2.prepTests.length, 1)
  assertEquals(page2.prepTests[0]!.id, 'pt-900')
  assertEquals(page2.prepTests[0]!.status, 'in_progress')
  assertEquals(page2.prepTests[0]!.blindReviewStatus, 'eligible')

  const completedOnly = await service.listPrepTestPool('user-1', { filter: 'completed' })
  assertEquals(completedOnly.total, 0)
})

Deno.test('listPrepTestPool resolves scaled scores from section raw scores when missing', async () => {
  const completedPt = baseSession({
    id: 'pt-sess-missing-scaled',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    started_at: '2026-01-05T00:00:00Z',
    completed_at: '2026-01-05T00:00:00Z',
    raw_score: 75,
    scaled_score: null,
    blind_review_completed_at: '2026-01-06T00:00:00Z',
    blind_review_raw_score: 75,
    blind_review_scaled_score: null,
  })
  const sectionSession = baseSession({
    id: 'sec-sess-1',
    kind: 'SECTION',
    prep_test_id: 'pt-900',
    section_id: 'sec-lr',
    started_at: '2026-01-05T01:00:00Z',
    completed_at: '2026-01-05T02:00:00Z',
    raw_score: 75,
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => [completedPt, sectionSession],
      getScoreRowForRaw: async () => ({ scaled_score: 158, percentile: 80 }),
    }) as never,
  })
  const out = await service.listPrepTestPool('user-1', { filter: 'completed' })
  assertEquals(out.prepTests[0]!.scaledScore, 158)
  assertEquals(out.prepTests[0]!.attempts[0]!.scaledScore, 158)
})

Deno.test('listPrepTestPool returns attempts newest first with blind review scores', async () => {
  const olderPt = baseSession({
    id: 'pt-sess-old',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-01T00:00:00Z',
    scaled_score: 139,
    blind_review_scaled_score: 139,
    blind_review_completed_at: '2026-01-02T00:00:00Z',
    started_at: '2026-01-01T00:00:00Z',
  })
  const newerPt = baseSession({
    id: 'pt-sess-new',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-10T00:00:00Z',
    scaled_score: 160,
    blind_review_completed_at: '2026-01-11T00:00:00Z',
    started_at: '2026-01-10T00:00:00Z',
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => [newerPt, olderPt],
    }) as never,
  })
  const out = await service.listPrepTestPool('user-1', { filter: 'completed' })
  assertEquals(out.prepTests[0]!.scaledScore, 160)
  assertEquals(out.prepTests[0]!.attempts.length, 2)
  assertEquals(out.prepTests[0]!.attempts[0]!.sessionId, 'pt-sess-new')
  assertEquals(out.prepTests[0]!.attempts[0]!.attemptNumber, 2)
  assertEquals(out.prepTests[0]!.attempts[1]!.blindReviewScaledScore, 139)
})

Deno.test('listPrepTestPool marks skipped blind review as completed with attempts', async () => {
  const completedPt = baseSession({
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-02T00:00:00Z',
    scaled_score: 170,
    metadata: { blindReviewSkipped: true },
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => [completedPt],
    }) as never,
  })
  const out = await service.listPrepTestPool('user-1', { filter: 'completed' })
  assertEquals(out.total, 1)
  assertEquals(out.prepTests[0]!.status, 'completed')
  assertEquals(out.prepTests[0]!.scaledScore, 170)
  assertEquals(out.prepTests[0]!.attempts.length, 1)
  assertEquals(out.prepTests[0]!.attempts[0]!.attemptNumber, 1)
})

Deno.test('skipBlindReview marks prep test fully complete', async () => {
  let skipped: unknown = null
  const completedPt = baseSession({
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-02T00:00:00Z',
    scaled_score: 165,
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [completedPt],
      updateSession: async (_id, _userId, patch) => {
        skipped = patch.metadata?.blindReviewSkipped
        return { ...completedPt, metadata: { ...completedPt.metadata, ...patch.metadata } }
      },
    }) as never,
  })
  const out = await service.skipBlindReview('user-1', { prepTestId: 'pt-900' })
  assertEquals(skipped, true)
  assertEquals(out.session.metadata.blindReviewSkipped, true)
})

Deno.test('getPrepTestDetail returns LR/RC sections only as practiceable', async () => {
  const service = createPracticeService({ repository: preptestRepo() as never })
  const out = await service.getPrepTestDetail('user-1', { prepTestId: 'pt-900' })
  assertEquals(out.sections.length, 3)
  assertEquals(out.sections.filter((s) => s.practiceable).length, 2)
  assertEquals(out.prepTest.label, 'PT 900')
})

Deno.test('getPrepTestDetail scopes section progress to open prep test attempt on retake', async () => {
  const openPrepTest = baseSession({
    id: 'pt-retake',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    started_at: '2026-01-10T00:00:00Z',
    completed_at: null,
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [
        openPrepTest,
        baseSession({
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-lr',
          started_at: '2026-01-02T00:00:00Z',
          completed_at: '2026-01-02T01:00:00Z',
          metadata: {
            answeredQuestionIds: ['q1', 'q2'],
            questionIds: ['q1', 'q2', 'q3'],
          },
        }),
        baseSession({
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-rc',
          started_at: '2026-01-03T00:00:00Z',
          completed_at: null,
          metadata: { answeredQuestionIds: [], questionIds: ['q4', 'q5'] },
        }),
      ],
    }) as never,
  })
  const out = await service.getPrepTestDetail('user-1', { prepTestId: 'pt-900' })
  const lr = out.sections.find((s) => s.id === 'sec-lr')
  const rc = out.sections.find((s) => s.id === 'sec-rc')
  assertEquals(lr?.completed, false)
  assertEquals(lr?.answeredCount, 0)
  assertEquals(lr?.activeSectionSessionId, null)
  assertEquals(rc?.completed, false)
  assertEquals(rc?.answeredCount, 0)
  assertEquals(rc?.activeSectionSessionId, null)
})

Deno.test('startPrepTest creates PREPTEST session when none open', async () => {
  const service = createPracticeService({ repository: preptestRepo() as never })
  const out = await service.startPrepTest('user-1', { prepTestId: 'pt-900' })
  assertEquals(out.prepTestSession.kind, 'PREPTEST')
  assertEquals(out.detail.status, 'in_progress')
})

Deno.test('startPrepTest is idempotent when PREPTEST session already open', async () => {
  let insertCount = 0
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [
        baseSession({ kind: 'PREPTEST', prep_test_id: 'pt-900', completed_at: null }),
      ],
      insertSession: async () => {
        insertCount += 1
        return baseSession({ kind: 'PREPTEST', prep_test_id: 'pt-900' })
      },
    }) as never,
  })
  await service.startPrepTest('user-1', { prepTestId: 'pt-900' })
  assertEquals(insertCount, 0)
})

Deno.test('completePrepTest aggregates section scores', async () => {
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [
        baseSession({
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-lr',
          completed_at: '2026-01-02T00:00:00Z',
          raw_score: 2,
        }),
        baseSession({
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-rc',
          completed_at: '2026-01-02T01:00:00Z',
          raw_score: 1,
        }),
      ],
      getScoreRowForRaw: async () => ({ scaled_score: 165, percentile: 80 }),
    }) as never,
  })
  const out = await service.completePrepTest('user-1', { prepTestId: 'pt-900' })
  assertEquals(out.session.raw_score, 3)
  assertEquals(out.session.scaled_score, 165)
})

Deno.test('listBlindReviewPool returns completed prep tests eligible for blind review', async () => {
  const service = createPracticeService({
    repository: preptestRepo({
      listPrepTestPoolRows: async () => [prepTestPoolRows[0]!],
      listUserSessionsForPrepTest: async (_uid: string, prepTestId: string) =>
        prepTestId === 'pt-900'
          ? [
              baseSession({
                kind: 'PREPTEST',
                prep_test_id: 'pt-900',
                completed_at: '2026-01-03T00:00:00Z',
                scaled_score: 160,
              }),
            ]
          : [],
    }) as never,
  })
  const out = await service.listBlindReviewPool('user-1', {})
  assertEquals(out.prepTests.length, 1)
  assertEquals(out.prepTests[0]!.status, 'eligible')
  assertEquals(out.prepTests[0]!.scaledScore, 160)
})

Deno.test('listBlindReviewPool excludes prep tests without completed PREPTEST session', async () => {
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [],
    }) as never,
  })
  const out = await service.listBlindReviewPool('user-1', {})
  assertEquals(out.prepTests.length, 0)
})

Deno.test('listBlindReviewPool paginates and uses batch sessions query', async () => {
  let batchCalls = 0
  let perTestCalls = 0
  const completedPt900 = baseSession({
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-02T00:00:00Z',
    scaled_score: 170,
  })
  const completedPt901 = baseSession({
    kind: 'PREPTEST',
    prep_test_id: 'pt-901',
    completed_at: '2026-01-03T00:00:00Z',
    scaled_score: 165,
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTests: async () => {
        batchCalls += 1
        return [completedPt900, completedPt901]
      },
      listUserSessionsForPrepTest: async () => {
        perTestCalls += 1
        return []
      },
    }) as never,
  })
  const page1 = await service.listBlindReviewPool('user-1', { page: 1, pageSize: 1, sort: 'newest' })
  assertEquals(batchCalls, 1)
  assertEquals(perTestCalls, 0)
  assertEquals(page1.total, 2)
  assertEquals(page1.pageSize, 1)
  assertEquals(page1.prepTests.length, 1)
  assertEquals(page1.prepTests[0]!.id, 'pt-901')
  assertEquals(page1.statusCounts.all, 2)
  assertEquals(page1.statusCounts.eligible, 2)

  const page2 = await service.listBlindReviewPool('user-1', { page: 2, pageSize: 1, sort: 'newest' })
  assertEquals(page2.prepTests.length, 1)
  assertEquals(page2.prepTests[0]!.id, 'pt-900')

  const eligibleOnly = await service.listBlindReviewPool('user-1', { filter: 'eligible' })
  assertEquals(eligibleOnly.total, 2)
})

Deno.test('startBlindReview sets blindReviewActive on completed prep test session', async () => {
  let blindReviewActive: unknown = null
  const completedPt = baseSession({
    id: 'pt-sess-1',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-03T00:00:00Z',
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [completedPt],
      updateSession: async (
        _id: string,
        _uid: string,
        patch: { metadata?: Record<string, unknown> },
      ) => {
        blindReviewActive = patch.metadata?.blindReviewActive
        return { ...completedPt, metadata: (patch.metadata ?? {}) as Record<string, unknown> }
      },
    }) as never,
  })
  await service.startBlindReview('user-1', { prepTestId: 'pt-900' })
  assertEquals(blindReviewActive, true)
})

Deno.test('getBlindReviewDetail includes section session ids for completed sections', async () => {
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [
        baseSession({
          kind: 'PREPTEST',
          prep_test_id: 'pt-900',
          completed_at: '2026-01-03T00:00:00Z',
          scaled_score: 160,
        }),
        baseSession({
          id: 'sec-sess-lr',
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-lr',
          completed_at: '2026-01-02T00:00:00Z',
          metadata: { questionIds: ['q-1', 'q-2', 'q-3'], answeredQuestionIds: ['q-1'] },
        }),
      ],
    }) as never,
  })
  const out = await service.getBlindReviewDetail('user-1', { prepTestId: 'pt-900' })
  assertEquals(out.blindReview.status, 'eligible')
  const lr = out.sections.find((s) => s.id === 'sec-lr')
  assertEquals(lr?.sectionSessionId, 'sec-sess-lr')
})

Deno.test('completeBlindReview scores latest answers across section sessions', async () => {
  const completedPt = baseSession({
    id: 'pt-sess-1',
    kind: 'PREPTEST',
    prep_test_id: 'pt-900',
    completed_at: '2026-01-03T00:00:00Z',
    metadata: { blindReviewActive: true },
  })
  const service = createPracticeService({
    repository: preptestRepo({
      listUserSessionsForPrepTest: async () => [
        completedPt,
        baseSession({
          id: 'sec-sess-lr',
          kind: 'SECTION',
          prep_test_id: 'pt-900',
          section_id: 'sec-lr',
          completed_at: '2026-01-02T00:00:00Z',
        }),
      ],
      listAnswerEventsForSessions: async () =>
        [
          {
            id: 'e1',
            user_id: 'user-1',
            practice_session_id: 'sec-sess-lr',
            question_id: 'q-1',
            selected_answer: 'A',
            is_correct: true,
            question_type_id: null,
            section_type: 'LR',
            difficulty: 2,
            session_kind: 'SECTION',
            created_at: '2026-01-04T00:00:00Z',
          },
          {
            id: 'e2',
            user_id: 'user-1',
            practice_session_id: 'sec-sess-lr',
            question_id: 'q-2',
            selected_answer: 'B',
            is_correct: false,
            question_type_id: null,
            section_type: 'LR',
            difficulty: 2,
            session_kind: 'SECTION',
            created_at: '2026-01-04T01:00:00Z',
          },
        ] as AnswerEventRow[],
      getScoreRowForRaw: async () => ({ scaled_score: 155, percentile: 70 }),
      updateSession: async (
        _id: string,
        _uid: string,
        patch: {
          blind_review_raw_score?: number | null
          blind_review_scaled_score?: number | null
          blind_review_percentile?: number | null
          blind_review_completed_at?: string | null
          metadata?: Record<string, unknown>
        },
      ) => ({
        ...completedPt,
        blind_review_raw_score: patch.blind_review_raw_score ?? null,
        blind_review_scaled_score: patch.blind_review_scaled_score ?? null,
        blind_review_percentile: patch.blind_review_percentile ?? null,
        blind_review_completed_at: patch.blind_review_completed_at ?? null,
        metadata: (patch.metadata ?? completedPt.metadata) as Record<string, unknown>,
      }),
    }) as never,
  })
  const out = await service.completeBlindReview('user-1', { prepTestId: 'pt-900' })
  assertEquals(out.session.blind_review_raw_score, 1)
  assertEquals(out.session.blind_review_scaled_score, 155)
  assertEquals(out.session.metadata.blindReviewActive, false)
})

Deno.test('submitAnswer rejects question outside section session', async () => {
  const repo = {
    ...sectionRepo(),
    getSessionById: async () =>
      baseSession({
        kind: 'SECTION',
        section_id: 'sec-db-1',
        metadata: { questionIds: ['q-1', 'q-2'] },
      }),
    getQuestionDetail: async () =>
      ({
        id: 'q-wrong',
        correct_answer: 'A',
        difficulty: 2,
        question_type_id: null,
        section_id: 'other-section',
        admin_sections: { section_type: 'LR' as const, prep_test_id: 'pt-900' },
      }) satisfies QuestionDetailRow,
  }
  const service = createPracticeService({ repository: repo as never })
  await assertRejects(
    () =>
      service.submitAnswer('user-1', {
        sessionId: 'sess-1',
        questionId: 'q-wrong',
        selectedAnswer: 'A',
      }),
    PracticeValidationError,
  )
})
