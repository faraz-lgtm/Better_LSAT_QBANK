import { CORS_EDGE_NARROW, json, requireAuthUser } from '../_shared/edge-http.ts'
import { createPrepCourseRepository, createServiceRoleClient } from './prep-course.repository.ts'
import { AuthorizationError, createPrepCourseService, EntitlementError } from './prep-course.service.ts'

const corsHeaders = CORS_EDGE_NARROW

export async function handlePrepCourseRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const auth = await requireAuthUser(req, corsHeaders)
  if (!auth.ok) return auth.response

  const service = createPrepCourseService({
    repository: createPrepCourseRepository(createServiceRoleClient()),
  })

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const courseSlug = url.searchParams.get('courseSlug')
      const lessonSlug = url.searchParams.get('lessonSlug')
      if (!courseSlug) {
        const courses = await service.listCourses(auth.user.id)
        return json({ courses }, {}, corsHeaders)
      }
      if (lessonSlug) {
        const data = await service.getLesson(auth.user.id, courseSlug, lessonSlug)
        return json(data, {}, corsHeaders)
      }
      const data = await service.getCourseWithLessons(auth.user.id, courseSlug)
      return json(data, {}, corsHeaders)
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const courseSlug = typeof body.courseSlug === 'string' ? body.courseSlug : ''
      const lessonSlug = typeof body.lessonSlug === 'string' ? body.lessonSlug : ''
      if (!courseSlug.trim() || !lessonSlug.trim()) {
        return json({ error: 'courseSlug and lessonSlug are required' }, { status: 400 }, corsHeaders)
      }
      const data = await service.completeLesson(auth.user.id, courseSlug, lessonSlug)
      return json(data, {}, corsHeaders)
    }

    return json({ error: 'Method not allowed' }, { status: 405 }, corsHeaders)
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
