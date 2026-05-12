import { isPrepLessonType, type PrepLessonType } from '../_shared/prep-lesson-type.ts'
import type { PrepCourseRepository } from './prep-course.repository.ts'

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
      const lessons = await deps.repository.listPublishedLessonsByCourse(course.id)
      return { course, lessons }
    },

    async getLesson(userId: string, courseSlug: string, lessonSlug: string) {
      await requireLearnerAccess(userId)
      const course = await deps.repository.getPublishedCourseBySlug(normalizeSlug(courseSlug))
      if (!course) throw new Error('Course not found')
      const lesson = await deps.repository.getPublishedLessonBySlug(course.id, normalizeSlug(lessonSlug))
      if (!lesson) throw new Error('Lesson not found')
      const drill =
        lesson.lesson_type === 'active_drill' || lesson.lesson_type === 'adaptive_drill'
          ? await deps.repository.listLessonLinkedQuestionRefs(lesson.id)
          : []
      return { course, lesson, linkedQuestionRefs: drill }
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
