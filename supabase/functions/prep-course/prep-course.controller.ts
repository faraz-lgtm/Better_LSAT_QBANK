import { createClient } from 'npm:@supabase/supabase-js@2'
import { createPrepCourseRepository, createServiceRoleClient } from './prep-course.repository.ts'
import { AuthorizationError, createPrepCourseService, EntitlementError } from './prep-course.service.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...init.headers,
    },
  })
}

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

export async function handlePrepCourseRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Unauthorized' }, { status: 401 })

  const service = createPrepCourseService({
    repository: createPrepCourseRepository(createServiceRoleClient()),
  })

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const courseSlug = url.searchParams.get('courseSlug')
      const lessonSlug = url.searchParams.get('lessonSlug')
      if (!courseSlug) {
        const courses = await service.listCourses(user.id)
        return json({ courses })
      }
      if (lessonSlug) {
        const data = await service.getLesson(user.id, courseSlug, lessonSlug)
        return json(data)
      }
      const data = await service.getCourseWithLessons(user.id, courseSlug)
      return json(data)
    }

    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 })
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = readString(body, 'action')

    if (action === 'list-courses') {
      const courses = await service.listCourses(user.id)
      return json({ courses })
    }
    if (action === 'get-course') {
      const courseSlug = readString(body, 'courseSlug')
      if (!courseSlug) return json({ error: 'courseSlug is required' }, { status: 400 })
      return json(await service.getCourseWithLessons(user.id, courseSlug))
    }
    if (action === 'get-lesson') {
      const courseSlug = readString(body, 'courseSlug')
      const lessonSlug = readString(body, 'lessonSlug')
      if (!courseSlug || !lessonSlug) {
        return json({ error: 'courseSlug and lessonSlug are required' }, { status: 400 })
      }
      return json(await service.getLesson(user.id, courseSlug, lessonSlug))
    }

    if (action === 'admin-create-course') {
      const slug = readString(body, 'slug')
      const title = readString(body, 'title')
      if (!slug || !title) return json({ error: 'slug and title are required' }, { status: 400 })
      const course = await service.adminCreateCourse(user.id, {
        slug,
        title,
        description: readString(body, 'description') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ course })
    }

    if (action === 'admin-add-lesson') {
      const courseId = readString(body, 'courseId')
      const slug = readString(body, 'slug')
      const title = readString(body, 'title')
      const lessonType = readString(body, 'lessonType')
      const sortOrder = readNumber(body, 'sortOrder')
      if (!courseId || !slug || !title || !lessonType || sortOrder === undefined) {
        return json(
          { error: 'courseId, slug, title, lessonType, sortOrder are required' },
          { status: 400 },
        )
      }
      if (lessonType !== 'video' && lessonType !== 'text') {
        return json({ error: 'lessonType must be video or text' }, { status: 400 })
      }

      const lesson = await service.adminAddLesson(user.id, {
        courseId,
        slug,
        title,
        lessonType,
        sortOrder,
        summary: readString(body, 'summary') ?? null,
        durationMinutes: readNumber(body, 'durationMinutes') ?? null,
        videoUrl: readString(body, 'videoUrl') ?? null,
        textContent: readString(body, 'textContent') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ lesson })
    }

    if (action === 'admin-update-course') {
      const courseId = readString(body, 'courseId')
      if (!courseId) return json({ error: 'courseId is required' }, { status: 400 })
      const course = await service.adminUpdateCourse(user.id, {
        courseId,
        title: readString(body, 'title'),
        description: readString(body, 'description') ?? null,
        isPublished: readBoolean(body, 'isPublished'),
      })
      return json({ course })
    }

    if (action === 'admin-update-lesson') {
      const lessonId = readString(body, 'lessonId')
      if (!lessonId) return json({ error: 'lessonId is required' }, { status: 400 })
      const lessonType = readString(body, 'lessonType')
      if (lessonType !== undefined && lessonType !== 'video' && lessonType !== 'text') {
        return json({ error: 'lessonType must be video or text' }, { status: 400 })
      }
      const lesson = await service.adminUpdateLesson(user.id, {
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
      return json({ lesson })
    }

    return json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return json({ error: error.message }, { status: 403 })
    }
    if (error instanceof EntitlementError) {
      return json({ error: error.message, reason: error.reason }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error(error)
    return json({ error: message }, { status: 500 })
  }
}
