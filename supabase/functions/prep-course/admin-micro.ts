import { CORS_EDGE_NARROW, json, requireAuthUser } from '../_shared/edge-http.ts'
import { isPrepLessonType } from '../_shared/prep-lesson-type.ts'
import { createPrepCourseRepository, createServiceRoleClient } from './prep-course.repository.ts'
import { AuthorizationError, createPrepCourseService, EntitlementError } from './prep-course.service.ts'

const corsHeaders = CORS_EDGE_NARROW

function readString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key]
  return typeof value === 'string' ? value : undefined
}

function readBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
  const value = body[key]
  return typeof value === 'boolean' ? value : undefined
}

function readNumber(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key]
  return typeof value === 'number' ? value : undefined
}

export async function handlePrepCourseAdminMicro(req: Request, slug: string): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
  }

  const auth = await requireAuthUser(req, corsHeaders)
  if (!auth.ok) return auth.response

  const service = createPrepCourseService({
    repository: createPrepCourseRepository(createServiceRoleClient()),
  })

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = slug

    if (action === 'prep-course-admin-create-course') {
      const slugVal = readString(body, 'slug')
      const title = readString(body, 'title')
      if (!slugVal || !title) return json({ error: 'slug and title are required' }, { status: 400 }, corsHeaders)
      const course = await service.adminCreateCourse(auth.user.id, {
        slug: slugVal,
        title,
        description: readString(body, 'description') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ course }, {}, corsHeaders)
    }

    if (action === 'prep-course-admin-add-lesson') {
      const courseId = readString(body, 'courseId')
      const slugVal = readString(body, 'slug')
      const title = readString(body, 'title')
      const lessonType = readString(body, 'lessonType')
      const sortOrder = readNumber(body, 'sortOrder')
      if (!courseId || !slugVal || !title || !lessonType || sortOrder === undefined) {
        return json(
          { error: 'courseId, slug, title, lessonType, sortOrder are required' },
          { status: 400 },
          corsHeaders,
        )
      }
      if (!isPrepLessonType(lessonType)) {
        return json(
          {
            error: 'lessonType must be one of: video_text, active_drill, adaptive_drill, rep_work',
          },
          { status: 400 },
          corsHeaders,
        )
      }

      const lesson = await service.adminAddLesson(auth.user.id, {
        courseId,
        slug: slugVal,
        title,
        lessonType,
        sortOrder,
        summary: readString(body, 'summary') ?? null,
        durationMinutes: readNumber(body, 'durationMinutes') ?? null,
        videoUrl: readString(body, 'videoUrl') ?? null,
        textContent: readString(body, 'textContent') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ lesson }, {}, corsHeaders)
    }

    if (action === 'prep-course-admin-update-course') {
      const courseId = readString(body, 'courseId')
      if (!courseId) return json({ error: 'courseId is required' }, { status: 400 }, corsHeaders)
      const course = await service.adminUpdateCourse(auth.user.id, {
        courseId,
        title: readString(body, 'title'),
        description: readString(body, 'description') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ course }, {}, corsHeaders)
    }

    if (action === 'prep-course-admin-update-lesson') {
      const lessonId = readString(body, 'lessonId')
      if (!lessonId) return json({ error: 'lessonId is required' }, { status: 400 }, corsHeaders)
      const lessonType = readString(body, 'lessonType')
      if (lessonType !== undefined && !isPrepLessonType(lessonType)) {
        return json(
          {
            error: 'lessonType must be one of: video_text, active_drill, adaptive_drill, rep_work',
          },
          { status: 400 },
          corsHeaders,
        )
      }
      const lesson = await service.adminUpdateLesson(auth.user.id, {
        lessonId,
        title: readString(body, 'title'),
        lessonType,
        sortOrder: readNumber(body, 'sortOrder'),
        summary: readString(body, 'summary') ?? null,
        durationMinutes: readNumber(body, 'durationMinutes'),
        videoUrl: readString(body, 'videoUrl') ?? null,
        textContent: readString(body, 'textContent') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ lesson }, {}, corsHeaders)
    }

    return json({ error: 'Unknown prep-course admin slug' }, { status: 400 }, corsHeaders)
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return json({ error: error.message }, { status: 403 }, corsHeaders)
    }
    if (error instanceof EntitlementError) {
      return json({ error: error.message, reason: error.reason }, { status: 403 }, corsHeaders)
    }
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error(error)
    return json({ error: message }, { status: 500 }, corsHeaders)
  }
}
