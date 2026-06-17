import { isPrepLessonType, type PrepLessonType } from '../_shared/prep-lesson-type.ts'
import type { PrepCourseRepository, PrepLessonActiveDrillAttempt, PrepLessonDrillBlindReviewAttempt } from './prep-course.repository.ts'

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class EntitlementError extends Error {
  readonly reason: 'LSAC_REQUIRED'

  constructor(message: string, reason: 'LSAC_REQUIRED' = 'LSAC_REQUIRED') {
    super(message)
    this.name = 'EntitlementError'
    this.reason = reason
  }
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function drillQuestionIdsFromMetadata(metadata: Record<string, unknown>): string[] {
  const raw = metadata.questionIds
  if (!Array.isArray(raw)) return []
  return raw.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

function latestAnswersByQuestion(
  events: Array<{
    question_id: string
    selected_answer: string
    is_correct: boolean
    created_at: string
  }>,
): Map<string, { questionId: string; selectedAnswer: string; isCorrect: boolean }> {
  const byQuestion = new Map<string, { questionId: string; selectedAnswer: string; isCorrect: boolean }>()
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!
    if (!byQuestion.has(e.question_id)) {
      byQuestion.set(e.question_id, {
        questionId: e.question_id,
        selectedAnswer: e.selected_answer,
        isCorrect: e.is_correct,
      })
    }
  }
  return byQuestion
}

type DrillAnswerSnapshot = {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
}

function parseDrillAnswerSnapshots(value: unknown): DrillAnswerSnapshot[] | null {
  if (!Array.isArray(value)) return null
  const parsed: DrillAnswerSnapshot[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const record = row as Record<string, unknown>
    const questionId = typeof record.questionId === 'string' ? record.questionId : ''
    const selectedAnswer = typeof record.selectedAnswer === 'string' ? record.selectedAnswer : ''
    const isCorrect = record.isCorrect === true
    if (!questionId || !selectedAnswer) continue
    parsed.push({ questionId, selectedAnswer, isCorrect })
  }
  return parsed.length > 0 ? parsed : null
}

function parseDrillBlindReview(metadata: Record<string, unknown>): PrepLessonDrillBlindReviewAttempt | null {
  const completedAt = metadata.drillBlindReviewCompletedAt
  if (typeof completedAt !== 'string' || !completedAt) return null
  const answers = parseDrillAnswerSnapshots(metadata.drillBlindReviewAnswers)
  if (!answers) return null
  const rawScore =
    typeof metadata.drillBlindReviewRawScore === 'number' && Number.isFinite(metadata.drillBlindReviewRawScore)
      ? metadata.drillBlindReviewRawScore
      : answers.filter((answer) => answer.isCorrect).length
  return { rawScore, completedAt, answers }
}

async function buildActiveDrillAttempt(
  repository: PrepCourseRepository,
  userId: string,
  lessonId: string,
): Promise<PrepLessonActiveDrillAttempt | null> {
  const session = await repository.getLatestLessonDrillAttempt(userId, lessonId)
  if (!session?.completed_at) return null

  const questionIds = drillQuestionIdsFromMetadata(session.metadata)
  const questionCount = questionIds.length > 0 ? questionIds.length : 1
  const events = await repository.listAnswerEventsForSession(session.id, userId)
  const actualFromMeta = parseDrillAnswerSnapshots(session.metadata.drillActualAnswers)
  const answers = actualFromMeta ?? [...latestAnswersByQuestion(events).values()]
  const blindReview = parseDrillBlindReview(session.metadata)

  const started = new Date(session.started_at).getTime()
  const completed = new Date(session.completed_at).getTime()
  const elapsedSeconds = Number.isFinite(started) && Number.isFinite(completed)
    ? Math.max(0, Math.round((completed - started) / 1000))
    : 0

  return {
    sessionId: session.id,
    completedAt: session.completed_at,
    rawScore: session.raw_score ?? 0,
    questionCount,
    elapsedSeconds,
    answers,
    blindReview,
  }
}

export function createPrepCourseService(deps: {
  repository: PrepCourseRepository
  enforceEntitlement?: boolean
}) {
  // Temporary default: keep prep content accessible while LSAC entitlement data stabilizes.
  const enforceEntitlement = deps.enforceEntitlement === true

  async function requireAdmin(userId: string): Promise<void> {
    const profile = await deps.repository.getProfileRole(userId)
    if (!profile || profile.role !== 'admin') {
      throw new AuthorizationError('Admin access required')
    }
  }

  async function requireLearnerAccess(userId: string): Promise<void> {
    if (!enforceEntitlement) return

    const profile = await deps.repository.getProfileRole(userId)
    if (!profile) {
      throw new EntitlementError('LSAC account must be linked before accessing prep content')
    }
    if (profile.role === 'admin') return

    const isLinked = Boolean(profile.student_coaching_id)
    if (!isLinked) {
      throw new EntitlementError('LSAC account must be linked before accessing prep content')
    }

    const snapshot = await deps.repository.getLatestStudentSnapshotByUserId(userId)
    const linkedInSnapshot = snapshot?.linked === true
    const subscriptionType = snapshot?.subscription_type?.trim().toLowerCase() ?? null
    const hasEligibleSubscription = subscriptionType
      ? subscriptionType.includes('advantage') || subscriptionType.includes('prep')
      : false
    const isEligible = linkedInSnapshot || hasEligibleSubscription
    if (!isEligible) {
      throw new EntitlementError('LawHub Advantage eligibility is required for prep content')
    }
  }

  function validateLessonCreatePayload(input: {
    lessonType: PrepLessonType
    textContent?: string | null
  }): void {
    if (!isPrepLessonType(input.lessonType)) {
      throw new Error('lessonType is invalid')
    }
    if (!input.textContent?.trim()) {
      throw new Error('textContent is required')
    }
  }

  return {
    async listCourses(userId: string) {
      await requireLearnerAccess(userId)
      return await deps.repository.listPublishedCourses()
    },

    async getCourseWithLessons(userId: string, courseSlug: string) {
      await requireLearnerAccess(userId)
      const course = await deps.repository.getPublishedCourseBySlug(normalizeSlug(courseSlug))
      if (!course) throw new Error('Course not found')
      const curriculum = await deps.repository.listPublishedCurriculum(course.id)
      const lessons = await deps.repository.listPublishedLessonsByCourse(course.id)
      const completedLessonSlugs = await deps.repository.listCompletedLessonSlugsByCourse(userId, course.id)
      return { course, lessons, curriculum, completedLessonSlugs }
    },

    async completeLesson(userId: string, courseSlug: string, lessonSlug: string) {
      await requireLearnerAccess(userId)
      const course = await deps.repository.getPublishedCourseBySlug(normalizeSlug(courseSlug))
      if (!course) throw new Error('Course not found')
      const lesson = await deps.repository.getPublishedLessonBySlug(course.id, normalizeSlug(lessonSlug))
      if (!lesson) throw new Error('Lesson not found')
      await deps.repository.upsertLessonCompletion(userId, lesson.id)
      const completedLessonSlugs = await deps.repository.listCompletedLessonSlugsByCourse(userId, course.id)
      return { completedLessonSlugs }
    },

    async getLesson(userId: string, courseSlug: string, lessonSlug: string) {
      await requireLearnerAccess(userId)
      const course = await deps.repository.getPublishedCourseBySlug(normalizeSlug(courseSlug))
      if (!course) throw new Error('Course not found')
      const lesson = await deps.repository.getPublishedLessonBySlug(course.id, normalizeSlug(lessonSlug))
      if (!lesson) throw new Error('Lesson not found')

      const linkedQuestionRefs = await deps.repository.listLessonLinkedQuestions(lesson.id)
      const activeDrillAttempt =
        lesson.lesson_type === 'active_drill' || lesson.lesson_type === 'adaptive_drill'
          ? await buildActiveDrillAttempt(deps.repository, userId, lesson.id)
          : null

      return { course, lesson, linkedQuestionRefs, activeDrillAttempt }
    },

    async adminCreateCourse(
      userId: string,
      input: { slug: string; title: string; description?: string | null; isPublished?: boolean },
    ) {
      await requireAdmin(userId)
      const slug = normalizeSlug(input.slug)
      const title = input.title.trim()
      if (!slug) throw new Error('slug is required')
      if (!title) throw new Error('title is required')
      return await deps.repository.createCourse({
        slug,
        title,
        description: input.description?.trim() || null,
        isPublished: input.isPublished ?? false,
      })
    },

    async adminAddLesson(
      userId: string,
      input: {
        courseId: string
        slug: string
        title: string
        lessonType: PrepLessonType
        sortOrder: number
        summary?: string | null
        durationMinutes?: number | null
        videoUrl?: string | null
        textContent?: string | null
        isPublished?: boolean
      },
    ) {
      await requireAdmin(userId)
      if (!input.courseId) throw new Error('courseId is required')
      if (!Number.isInteger(input.sortOrder) || input.sortOrder <= 0) {
        throw new Error('sortOrder must be a positive integer')
      }
      validateLessonCreatePayload(input)
      return await deps.repository.addLesson({
        courseId: input.courseId,
        slug: normalizeSlug(input.slug),
        title: input.title.trim(),
        lessonType: input.lessonType,
        sortOrder: input.sortOrder,
        summary: input.summary?.trim() || null,
        durationMinutes: input.durationMinutes ?? null,
        videoUrl: input.videoUrl?.trim() || null,
        textContent: input.textContent?.trim() || null,
        isPublished: input.isPublished ?? false,
      })
    },

    async adminUpdateCourse(
      userId: string,
      input: { courseId: string; title?: string; description?: string | null; isPublished?: boolean },
    ) {
      await requireAdmin(userId)
      if (!input.courseId) throw new Error('courseId is required')
      return await deps.repository.updateCourse({
        courseId: input.courseId,
        title: input.title?.trim(),
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        isPublished: input.isPublished,
      })
    },

    async adminUpdateLesson(
      userId: string,
      input: {
        lessonId: string
        title?: string
        lessonType?: PrepLessonType
        sortOrder?: number
        summary?: string | null
        durationMinutes?: number | null
        videoUrl?: string | null
        textContent?: string | null
        isPublished?: boolean
      },
    ) {
      await requireAdmin(userId)
      if (!input.lessonId) throw new Error('lessonId is required')
      if (input.sortOrder !== undefined && (!Number.isInteger(input.sortOrder) || input.sortOrder <= 0)) {
        throw new Error('sortOrder must be a positive integer')
      }
      if (input.lessonType !== undefined && !isPrepLessonType(input.lessonType)) {
        throw new Error('lessonType is invalid')
      }
      if (input.textContent !== undefined && !(input.textContent ?? '').trim()) {
        throw new Error('textContent cannot be empty')
      }
      return await deps.repository.updateLesson({
        lessonId: input.lessonId,
        title: input.title?.trim(),
        lessonType: input.lessonType,
        sortOrder: input.sortOrder,
        summary: input.summary === undefined ? undefined : input.summary?.trim() || null,
        durationMinutes: input.durationMinutes,
        videoUrl: input.videoUrl === undefined ? undefined : input.videoUrl?.trim() || null,
        textContent: input.textContent === undefined ? undefined : input.textContent?.trim() || null,
        isPublished: input.isPublished,
      })
    },
  }
}

export type PrepCourseService = ReturnType<typeof createPrepCourseService>
