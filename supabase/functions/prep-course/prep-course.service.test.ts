import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import { FREE_PREP_COURSE_SLUG } from '../_shared/prep-course-free-access.ts'
import type { PrepLessonType } from '../_shared/prep-lesson-type.ts'
import type { PrepCourseRow, PrepLessonRow, ProfileRoleRow } from './prep-course.repository.ts'
import { createPrepCourseService, EntitlementError } from './prep-course.service.ts'

function mockRepo(
  overrides: Partial<{
    getProfileRole: (userId: string) => Promise<ProfileRoleRow | null>
    listPublishedCourses: () => Promise<PrepCourseRow[]>
    getPublishedCourseBySlug: (slug: string) => Promise<PrepCourseRow | null>
    listPublishedLessonsByCourse: (courseId: string) => Promise<PrepLessonRow[]>
    listPublishedCurriculum: (courseId: string) => Promise<{
      modules: Array<{
        id: string
        course_id: string
        title: string
        sort_order: number
        duration_minutes: number | null
        sections: Array<{
          id: string
          module_id: string
          title: string
          sort_order: number
          duration_minutes: number | null
          lessons: PrepLessonRow[]
        }>
      }>
    }>
    getPublishedLessonBySlug: (courseId: string, lessonSlug: string) => Promise<PrepLessonRow | null>
    listCompletedLessonSlugsByCourse: (userId: string, courseId: string) => Promise<string[]>
    listBookmarksByCourse: (userId: string, courseId: string) => Promise<{
      moduleIds: string[]
      lessonSlugs: string[]
    }>
    getPublishedModuleById: (courseId: string, moduleId: string) => Promise<{
      id: string
      course_id: string
      title: string
      sort_order: number
      duration_minutes: number | null
    } | null>
    setModuleBookmark: (userId: string, moduleId: string, bookmarked: boolean) => Promise<void>
    setLessonBookmark: (userId: string, lessonId: string, bookmarked: boolean) => Promise<void>
    upsertLessonCompletion: (userId: string, lessonId: string) => Promise<void>
    createCourse: (input: {
      slug: string
      title: string
      description: string | null
      isPublished: boolean
    }) => Promise<PrepCourseRow>
    addLesson: (input: {
      courseId: string
      slug: string
      title: string
      lessonType: PrepLessonType
      sortOrder: number
      summary: string | null
      durationMinutes: number | null
      videoUrl: string | null
      textContent: string | null
      isPublished: boolean
    }) => Promise<PrepLessonRow>
    updateCourse: (input: {
      courseId: string
      title?: string
      description?: string | null
      isPublished?: boolean
    }) => Promise<PrepCourseRow>
    updateLesson: (input: {
      lessonId: string
      title?: string
      lessonType?: PrepLessonType
      sortOrder?: number
      summary?: string | null
      durationMinutes?: number | null
      videoUrl?: string | null
      textContent?: string | null
      isPublished?: boolean
    }) => Promise<PrepLessonRow>
    getLatestStudentSnapshotByUserId: (userId: string) => Promise<{
      student_coaching_id: string | null
      linked: boolean | null
      subscription_type: string | null
      fetched_at: string
    } | null>
    listLessonLinkedQuestions: (lessonId: string) => Promise<
      Array<{
        question_id: string
        question_number: number | null
        prep_test_module_id: string | null
        prep_test_title: string | null
        section_number: number | null
        section_type: string | null
        section_title: string | null
      }>
    >
    getLatestLessonDrillAttempt: (
      userId: string,
      lessonId: string,
    ) => Promise<{
      id: string
      started_at: string
      completed_at: string | null
      raw_score: number | null
      metadata: Record<string, unknown>
    } | null>
    listAnswerEventsForSession: (
      sessionId: string,
      userId: string,
    ) => Promise<
      Array<{
        question_id: string
        selected_answer: string
        is_correct: boolean
        created_at: string
      }>
    >
  }> = {},
) {
  const course: PrepCourseRow = {
    id: 'course-1',
    slug: 'prep-course',
    title: 'Prep Course',
    description: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
  const lesson: PrepLessonRow = {
    id: 'lesson-1',
    course_id: 'course-1',
    section_id: 'section-1',
    slug: 'lesson-1',
    title: 'Lesson 1',
    lesson_type: 'video_text',
    sort_order: 1,
    summary: null,
    duration_minutes: 3,
    video_url: 'https://example.com/video',
    text_content: '<p>Lesson body</p>',
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  return {
    getProfileRole:
      overrides.getProfileRole ??
      (async () => ({ id: 'user-1', role: 'student', student_coaching_id: 'coach-1' })),
    getLatestStudentSnapshotByUserId:
      overrides.getLatestStudentSnapshotByUserId ??
      (async () => ({
        student_coaching_id: 'coach-1',
        linked: true,
        subscription_type: 'LawHub Advantage',
        fetched_at: '2026-01-01T00:00:00Z',
      })),
    listPublishedCourses:
      overrides.listPublishedCourses ??
      (async () => [course]),
    getPublishedCourseBySlug:
      overrides.getPublishedCourseBySlug ??
      (async () => course),
    listPublishedCurriculum:
      overrides.listPublishedCurriculum ??
      (async () => ({
        modules: [
          {
            id: 'mod-1',
            course_id: 'course-1',
            title: 'Module 1',
            sort_order: 1,
            duration_minutes: null,
            sections: [
              {
                id: 'section-1',
                module_id: 'mod-1',
                title: 'General',
                sort_order: 1,
                duration_minutes: null,
                lessons: [lesson],
              },
            ],
          },
        ],
      })),
    listPublishedLessonsByCourse:
      overrides.listPublishedLessonsByCourse ??
      (async () => [lesson]),
    getPublishedLessonBySlug:
      overrides.getPublishedLessonBySlug ??
      (async (_courseId, slug) => (slug === lesson.slug ? lesson : null)),
    listCompletedLessonSlugsByCourse:
      overrides.listCompletedLessonSlugsByCourse ??
      (async () => []),
    listBookmarksByCourse:
      overrides.listBookmarksByCourse ??
      (async () => ({ moduleIds: [], lessonSlugs: [] })),
    getPublishedModuleById:
      overrides.getPublishedModuleById ??
      (async (_courseId, moduleId) =>
        moduleId === 'mod-1'
          ? {
              id: 'mod-1',
              course_id: 'course-1',
              title: 'Module 1',
              sort_order: 1,
              duration_minutes: null,
            }
          : null),
    setModuleBookmark:
      overrides.setModuleBookmark ??
      (async () => {}),
    setLessonBookmark:
      overrides.setLessonBookmark ??
      (async () => {}),
    upsertLessonCompletion:
      overrides.upsertLessonCompletion ??
      (async () => {}),
    createCourse:
      overrides.createCourse ??
      (async (input) => ({ ...course, ...input, is_published: input.isPublished })),
    addLesson:
      overrides.addLesson ??
      (async (input) => ({
        ...lesson,
        course_id: input.courseId,
        slug: input.slug,
        title: input.title,
        lesson_type: input.lessonType,
        sort_order: input.sortOrder,
        summary: input.summary,
        duration_minutes: input.durationMinutes,
        video_url: input.videoUrl,
        text_content: input.textContent,
        is_published: input.isPublished,
      })),
    updateCourse:
      overrides.updateCourse ??
      (async (input) => ({ ...course, id: input.courseId })),
    updateLesson:
      overrides.updateLesson ??
      (async (input) => ({ ...lesson, id: input.lessonId })),
    listLessonLinkedQuestions:
      overrides.listLessonLinkedQuestions ??
      (async () => []),
    getLatestLessonDrillAttempt:
      overrides.getLatestLessonDrillAttempt ??
      (async () => null),
    listAnswerEventsForSession:
      overrides.listAnswerEventsForSession ??
      (async () => []),
  }
}

Deno.test('prep-course service lists published courses', async () => {
  const service = createPrepCourseService({ repository: mockRepo() })
  const courses = await service.listCourses('user-1')
  assertEquals(courses.length, 1)
  assertEquals(courses[0].slug, 'prep-course')
})

Deno.test('prep-course service rejects non-admin writes', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      getProfileRole: async () => ({ id: 'u1', role: 'student' }),
    }),
  })
  await assertRejects(
    () =>
      service.adminCreateCourse('u1', {
        slug: 'new-course',
        title: 'New Course',
      }),
    Error,
    'Admin access required',
  )
})

Deno.test('prep-course service validates lesson type payload', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      getProfileRole: async () => ({ id: 'admin-1', role: 'admin' }),
    }),
  })
  await assertRejects(
    () =>
      service.adminAddLesson('admin-1', {
        courseId: 'course-1',
        slug: 'lesson-without-body',
        title: 'Missing body',
        lessonType: 'video_text',
        sortOrder: 1,
        textContent: null,
      }),
    Error,
    'textContent is required',
  )
})

Deno.test('prep-course service returns course and lessons by slug', async () => {
  const service = createPrepCourseService({ repository: mockRepo() })
  const out = await service.getCourseWithLessons('user-1', 'PREP COURSE')
  assertEquals(out.course.slug, 'prep-course')
  assertEquals(out.lessons.length, 1)
  assertEquals(out.curriculum.modules.length, 1)
  assertEquals(out.completedLessonSlugs, [])
  assertEquals(out.bookmarks, { moduleIds: [], lessonSlugs: [] })
})

Deno.test('prep-course service returns bookmarks with course', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      listBookmarksByCourse: async () => ({ moduleIds: ['mod-1'], lessonSlugs: ['lesson-1'] }),
    }),
  })
  const out = await service.getCourseWithLessons('user-1', 'prep-course')
  assertEquals(out.bookmarks, { moduleIds: ['mod-1'], lessonSlugs: ['lesson-1'] })
})

Deno.test('prep-course service setModuleBookmark persists and returns bookmarks', async () => {
  let saved = false
  const service = createPrepCourseService({
    repository: mockRepo({
      setModuleBookmark: async (userId, moduleId, bookmarked) => {
        saved = true
        assertEquals(userId, 'user-1')
        assertEquals(moduleId, 'mod-1')
        assertEquals(bookmarked, true)
      },
      listBookmarksByCourse: async () => ({ moduleIds: ['mod-1'], lessonSlugs: [] }),
    }),
  })
  const out = await service.setModuleBookmark('user-1', 'prep-course', 'mod-1', true)
  assertEquals(saved, true)
  assertEquals(out.bookmarks.moduleIds, ['mod-1'])
})

Deno.test('prep-course service setLessonBookmark persists and returns bookmarks', async () => {
  let saved = false
  const service = createPrepCourseService({
    repository: mockRepo({
      setLessonBookmark: async (userId, lessonId, bookmarked) => {
        saved = true
        assertEquals(userId, 'user-1')
        assertEquals(lessonId, 'lesson-1')
        assertEquals(bookmarked, true)
      },
      listBookmarksByCourse: async () => ({ moduleIds: [], lessonSlugs: ['lesson-1'] }),
    }),
  })
  const out = await service.setLessonBookmark('user-1', 'prep-course', 'lesson-1', true)
  assertEquals(saved, true)
  assertEquals(out.bookmarks.lessonSlugs, ['lesson-1'])
})

Deno.test('prep-course service returns completed lesson slugs with course', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      listCompletedLessonSlugsByCourse: async () => ['lesson-1'],
    }),
  })
  const out = await service.getCourseWithLessons('user-1', 'prep-course')
  assertEquals(out.completedLessonSlugs, ['lesson-1'])
})

Deno.test('prep-course service completeLesson upserts and returns slugs', async () => {
  let upserted = false
  const service = createPrepCourseService({
    repository: mockRepo({
      upsertLessonCompletion: async (userId, lessonId) => {
        upserted = true
        assertEquals(userId, 'user-1')
        assertEquals(lessonId, 'lesson-1')
      },
      listCompletedLessonSlugsByCourse: async () => ['lesson-1'],
    }),
  })
  const out = await service.completeLesson('user-1', 'prep-course', 'lesson-1')
  assertEquals(upserted, true)
  assertEquals(out.completedLessonSlugs, ['lesson-1'])
})

Deno.test('prep-course service completeLesson rejects missing lesson', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      getPublishedLessonBySlug: async () => null,
    }),
  })
  await assertRejects(
    () => service.completeLesson('user-1', 'prep-course', 'missing'),
    Error,
    'Lesson not found',
  )
})

Deno.test('prep-course getLesson returns linked questions and active drill attempt', async () => {
  const activeLesson: PrepLessonRow = {
    id: 'lesson-drill',
    course_id: 'course-1',
    section_id: 'section-1',
    slug: 'active-drill-1',
    title: 'Active Drill',
    lesson_type: 'active_drill',
    sort_order: 1,
    summary: 'Practice one question.',
    duration_minutes: 0,
    video_url: null,
    text_content: '<p>Full content after drill.</p>',
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
  const service = createPrepCourseService({
    repository: mockRepo({
      getPublishedLessonBySlug: async (_courseId, slug) =>
        slug === activeLesson.slug ? activeLesson : null,
      listLessonLinkedQuestions: async () => [
        {
          question_id: 'q-99',
          question_number: 5,
          prep_test_module_id: 'LSAC133',
          prep_test_title: null,
          section_number: 2,
          section_type: 'LR',
          section_title: null,
        },
      ],
      getLatestLessonDrillAttempt: async () => ({
        id: 'sess-drill',
        started_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:05:00Z',
        raw_score: 1,
        metadata: { questionIds: ['q-99'], lessonId: 'lesson-drill' },
      }),
      listAnswerEventsForSession: async () => [
        {
          question_id: 'q-99',
          selected_answer: 'C',
          is_correct: true,
          created_at: '2026-01-01T00:01:00Z',
        },
      ],
    }),
  })
  const out = await service.getLesson('user-1', 'prep-course', 'active-drill-1')
  assertEquals(out.lesson.lesson_type, 'active_drill')
  assertEquals(out.linkedQuestionRefs.length, 1)
  assertEquals(out.linkedQuestionRefs[0]?.question_id, 'q-99')
  assertEquals(out.activeDrillAttempt?.rawScore, 1)
  assertEquals(out.activeDrillAttempt?.questionCount, 1)
  assertEquals(out.activeDrillAttempt?.elapsedSeconds, 300)
  assertEquals(out.activeDrillAttempt?.blindReview, null)
})

Deno.test('prep-course getLesson includes drill blind review attempt metadata', async () => {
  const activeLesson = {
    id: 'lesson-drill',
    course_id: 'course-1',
    slug: 'active-drill-1',
    title: 'Active Drill',
    lesson_type: 'active_drill' as const,
    sort_order: 1,
    summary: null,
    duration_minutes: null,
    video_url: null,
    text_content: null,
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
  const service = createPrepCourseService({
    repository: mockRepo({
      getPublishedLessonBySlug: async (_courseId, slug) =>
        slug === activeLesson.slug ? activeLesson : null,
      listLessonLinkedQuestions: async () => [
        {
          question_id: 'q-99',
          question_number: 5,
          prep_test_module_id: 'LSAC133',
          prep_test_title: null,
          section_number: 2,
          section_type: 'LR',
          section_title: null,
        },
      ],
      getLatestLessonDrillAttempt: async () => ({
        id: 'sess-drill',
        started_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:05:00Z',
        raw_score: 0,
        metadata: {
          questionIds: ['q-99'],
          lessonId: 'lesson-drill',
          drillActualAnswers: [{ questionId: 'q-99', selectedAnswer: 'A', isCorrect: false }],
          drillBlindReviewCompletedAt: '2026-01-01T00:10:00Z',
          drillBlindReviewRawScore: 1,
          drillBlindReviewAnswers: [{ questionId: 'q-99', selectedAnswer: 'C', isCorrect: true }],
        },
      }),
      listAnswerEventsForSession: async () => [
        {
          question_id: 'q-99',
          selected_answer: 'C',
          is_correct: true,
          created_at: '2026-01-01T00:08:00Z',
        },
      ],
    }),
  })
  const out = await service.getLesson('user-1', 'prep-course', 'active-drill-1')
  assertEquals(out.activeDrillAttempt?.answers[0]?.selectedAnswer, 'A')
  assertEquals(out.activeDrillAttempt?.answers[0]?.isCorrect, false)
  assertEquals(out.activeDrillAttempt?.blindReview?.rawScore, 1)
  assertEquals(out.activeDrillAttempt?.blindReview?.answers[0]?.isCorrect, true)
})

Deno.test('prep-course service blocks access when entitlement enforcement is enabled', async () => {
  const service = createPrepCourseService({
    repository: mockRepo({
      getProfileRole: async () => ({ id: 'user-1', role: 'student', student_coaching_id: null }),
    }),
    enforceEntitlement: true,
  })
  await assertRejects(
    () => service.listCourses('user-1'),
    Error,
    'LSAC account must be linked',
  )
})

const STRIPE_TEST_ENV: Record<string, string> = {
  STRIPE_SECRET_KEY_TEST: 'sk_test',
  STRIPE_WEBHOOK_SECRET_TEST: 'whsec',
  STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test',
  STRIPE_PRICE_ID_CORE_TEST: 'price_core_test',
  STRIPE_PRICE_ID_LIVE_MONTHLY_TEST: 'price_live_test',
  STRIPE_PRICE_ID_LSAC_YEARLY_TEST: 'price_lsac_test',
  SUPABASE_URL: 'https://abc.supabase.co',
}

async function withStripeTestEnv(run: () => Promise<void>): Promise<void> {
  const previous = { ...Deno.env.toObject() }
  for (const [key, value] of Object.entries(STRIPE_TEST_ENV)) {
    Deno.env.set(key, value)
  }
  try {
    await run()
  } finally {
    for (const key of Object.keys(STRIPE_TEST_ENV)) {
      Deno.env.delete(key)
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value != null) Deno.env.set(key, value)
    }
  }
}

function freeAccessLessons() {
  const kickoffLesson: PrepLessonRow = {
    id: 'lesson-kickoff',
    course_id: 'course-1',
    section_id: 'section-kickoff',
    slug: 'welcome-to-the-arena',
    title: 'Welcome to the Arena',
    lesson_type: 'video_text',
    sort_order: 1,
    summary: null,
    duration_minutes: 1,
    video_url: null,
    text_content: '<p>Welcome</p>',
    is_published: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
  const lockedLesson: PrepLessonRow = {
    ...kickoffLesson,
    id: 'lesson-anatomy',
    section_id: 'section-anatomy',
    slug: 'argument-basics',
    title: 'Argument Basics',
    sort_order: 1,
  }
  return { kickoffLesson, lockedLesson }
}

Deno.test('prep-course getLesson allows unpaid students to open The Kickoff', async () => {
  await withStripeTestEnv(async () => {
    const { kickoffLesson, lockedLesson } = freeAccessLessons()
    const service = createPrepCourseService({
      repository: mockRepo({
        getPublishedCourseBySlug: async () => ({
          id: 'course-1',
          slug: FREE_PREP_COURSE_SLUG,
          title: 'LSAT Essential Course',
          description: null,
          is_published: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
        getPublishedLessonBySlug: async (_courseId, slug) =>
          slug === kickoffLesson.slug ? kickoffLesson : slug === lockedLesson.slug ? lockedLesson : null,
        listPublishedCurriculum: async () => ({
          modules: [
            {
              id: 'kickoff',
              course_id: 'course-1',
              title: 'The Kickoff',
              sort_order: 1,
              duration_minutes: null,
              sections: [
                {
                  id: 'section-kickoff',
                  module_id: 'kickoff',
                  title: 'General',
                  sort_order: 1,
                  duration_minutes: null,
                  lessons: [kickoffLesson],
                },
              ],
            },
            {
              id: 'anatomy',
              course_id: 'course-1',
              title: 'The Anatomy of an Argument',
              sort_order: 2,
              duration_minutes: null,
              sections: [
                {
                  id: 'section-anatomy',
                  module_id: 'anatomy',
                  title: 'General',
                  sort_order: 1,
                  duration_minutes: null,
                  lessons: [lockedLesson],
                },
              ],
            },
          ],
        }),
      }),
      hasActiveSubscription: async () => false,
    })
    const out = await service.getLesson('user-1', FREE_PREP_COURSE_SLUG, 'welcome-to-the-arena')
    assertEquals(out.lesson.slug, 'welcome-to-the-arena')
  })
})

Deno.test('prep-course getLesson blocks unpaid students from later modules', async () => {
  await withStripeTestEnv(async () => {
    const { kickoffLesson, lockedLesson } = freeAccessLessons()
    const service = createPrepCourseService({
      repository: mockRepo({
        getPublishedCourseBySlug: async () => ({
          id: 'course-1',
          slug: FREE_PREP_COURSE_SLUG,
          title: 'LSAT Essential Course',
          description: null,
          is_published: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
        getPublishedLessonBySlug: async (_courseId, slug) =>
          slug === kickoffLesson.slug ? kickoffLesson : slug === lockedLesson.slug ? lockedLesson : null,
        listPublishedCurriculum: async () => ({
          modules: [
            {
              id: 'kickoff',
              course_id: 'course-1',
              title: 'The Kickoff',
              sort_order: 1,
              duration_minutes: null,
              sections: [
                {
                  id: 'section-kickoff',
                  module_id: 'kickoff',
                  title: 'General',
                  sort_order: 1,
                  duration_minutes: null,
                  lessons: [kickoffLesson],
                },
              ],
            },
            {
              id: 'anatomy',
              course_id: 'course-1',
              title: 'The Anatomy of an Argument',
              sort_order: 2,
              duration_minutes: null,
              sections: [
                {
                  id: 'section-anatomy',
                  module_id: 'anatomy',
                  title: 'General',
                  sort_order: 1,
                  duration_minutes: null,
                  lessons: [lockedLesson],
                },
              ],
            },
          ],
        }),
      }),
      hasActiveSubscription: async () => false,
    })
    await assertRejects(
      () => service.getLesson('user-1', FREE_PREP_COURSE_SLUG, 'argument-basics'),
      EntitlementError,
      'Subscribe to access this prep course content',
    )
  })
})
