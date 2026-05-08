import { assertEquals, assertRejects } from 'jsr:@std/assert@1'
import type { PrepLessonType } from '../_shared/prep-lesson-type.ts'
import type { PrepCourseRow, PrepLessonRow, ProfileRoleRow } from './prep-course.repository.ts'
import { createPrepCourseService } from './prep-course.service.ts'

function mockRepo(
  overrides: Partial<{
    getProfileRole: (userId: string) => Promise<ProfileRoleRow | null>
    listPublishedCourses: () => Promise<PrepCourseRow[]>
    getPublishedCourseBySlug: (slug: string) => Promise<PrepCourseRow | null>
    listPublishedLessonsByCourse: (courseId: string) => Promise<PrepLessonRow[]>
    getPublishedLessonBySlug: (courseId: string, lessonSlug: string) => Promise<PrepLessonRow | null>
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
    listPublishedLessonsByCourse:
      overrides.listPublishedLessonsByCourse ??
      (async () => [lesson]),
    getPublishedLessonBySlug:
      overrides.getPublishedLessonBySlug ??
      (async () => lesson),
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
