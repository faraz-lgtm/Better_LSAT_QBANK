import { createClient } from "npm:@supabase/supabase-js@2"
import { createAdminRepository, createServiceRoleClient } from "./admin.repository.ts"
import { AuthorizationError, createAdminService } from "./admin.service.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init.headers,
    },
  })
}

function readString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key]
  return typeof value === "string" ? value : undefined
}

function readNumber(body: Record<string, unknown>, key: string): number | undefined {
  const value = body[key]
  return typeof value === "number" ? value : undefined
}

function readBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
  const value = body[key]
  return typeof value === "boolean" ? value : undefined
}

export async function handleAdminRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Server misconfigured" }, { status: 500 })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: "Unauthorized" }, { status: 401 })

  const service = createAdminService({
    repository: createAdminRepository(createServiceRoleClient()),
  })

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = readString(body, "action")

    if (action === "admin-bootstrap-projection") {
      return json(await service.bootstrapProjection(user.id))
    }
    if (action === "admin-list-question-types") {
      return json({ rows: await service.listQuestionTypes() })
    }
    if (action === "admin-create-question-type") {
      const name = readString(body, "name")
      const sectionType = readString(body, "sectionType") as "LR" | "RC" | "LG" | undefined
      if (!name || !sectionType) return json({ error: "name and sectionType are required" }, { status: 400 })
      return json({
        row: await service.createQuestionType(user.id, {
          name,
          sectionType,
          avgPerTest: readNumber(body, "avgPerTest"),
          goalAccuracy: readNumber(body, "goalAccuracy"),
        }),
      })
    }
    if (action === "admin-update-question-type") {
      const id = readString(body, "id")
      if (!id) return json({ error: "id is required" }, { status: 400 })
      return json({
        row: await service.updateQuestionType(user.id, id, {
          name: readString(body, "name"),
          avgPerTest: readNumber(body, "avgPerTest") ?? null,
          goalAccuracy: readNumber(body, "goalAccuracy") ?? null,
          isActive: readBoolean(body, "isActive"),
        }),
      })
    }
    if (action === "admin-deactivate-question-type") {
      const id = readString(body, "id")
      if (!id) return json({ error: "id is required" }, { status: 400 })
      return json({ row: await service.deactivateQuestionType(user.id, id) })
    }
    if (action === "admin-seed-default-question-types") {
      return json(await service.seedDefaultQuestionTypes(user.id))
    }
    if (action === "admin-list-preptests") {
      const contentFilter = readString(body, "contentFilter")
      const result = await service.listPrepTests(
        user.id,
        readNumber(body, "limit") ?? 10,
        readNumber(body, "offset") ?? 0,
        contentFilter,
      )
      return json({
        rows: result.rows,
        total: result.total,
      })
    }
    if (action === "admin-get-preptest-detail") {
      const prepTestId = readString(body, "prepTestId")
      if (!prepTestId) return json({ error: "prepTestId is required" }, { status: 400 })
      return json(await service.getPrepTestDetail(user.id, prepTestId))
    }
    if (action === "admin-get-next-question-for-preptest") {
      const prepTestId = readString(body, "prepTestId")
      if (!prepTestId) return json({ error: "prepTestId is required" }, { status: 400 })
      return json(await service.getNextQuestionForPrepTest(user.id, prepTestId))
    }
    if (action === "admin-get-question-editor-payload") {
      const questionId = readString(body, "questionId")
      if (!questionId) return json({ error: "questionId is required" }, { status: 400 })
      return json(await service.getQuestionEditorPayload(user.id, questionId))
    }
    if (action === "admin-update-question-meta") {
      const questionId = readString(body, "questionId")
      const data = body.data as Record<string, unknown> | undefined
      if (!questionId || !data) return json({ error: "questionId and data are required" }, { status: 400 })
      return json({ row: await service.updateQuestionMeta(user.id, questionId, data) })
    }
    if (action === "admin-dashboard") {
      return json(await service.getDashboard(user.id))
    }
    if (action === "admin-list-courses") {
      return json({ rows: await service.listCourses(user.id) })
    }
    if (action === "admin-create-course") {
      const title = readString(body, "title")
      const slug = readString(body, "slug")
      if (!title || !slug) return json({ error: "title and slug are required" }, { status: 400 })
      return json({
        row: await service.createCourse(user.id, {
          title,
          slug,
          description: readString(body, "description"),
          isPublished: readBoolean(body, "isPublished"),
        }),
      })
    }
    if (action === "admin-update-course") {
      const courseId = readString(body, "courseId")
      const data = body.data as Record<string, unknown> | undefined
      if (!courseId || !data) return json({ error: "courseId and data are required" }, { status: 400 })
      return json({ row: await service.updateCourse(user.id, courseId, data) })
    }
    if (action === "admin-delete-course") {
      const courseId = readString(body, "courseId")
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 })
      return json(await service.deleteCourse(user.id, courseId))
    }
    if (action === "admin-list-lessons") {
      const courseId = readString(body, "courseId")
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 })
      return json({ rows: await service.listLessons(user.id, courseId) })
    }
    if (action === "admin-create-lesson") {
      const courseId = readString(body, "courseId")
      const title = readString(body, "title")
      const slug = readString(body, "slug")
      if (!courseId || !title || !slug) {
        return json({ error: "courseId, title and slug are required" }, { status: 400 })
      }
      return json({
        row: await service.createLesson(user.id, {
          courseId,
          title,
          slug,
          summary: readString(body, "summary"),
          durationMinutes: readNumber(body, "durationMinutes"),
          lessonType: (readString(body, "lessonType") as "video" | "text" | undefined) ?? "text",
          videoUrl: readString(body, "videoUrl"),
          textContent: readString(body, "textContent"),
          isPublished: readBoolean(body, "isPublished"),
        }),
      })
    }
    if (action === "admin-update-lesson") {
      const lessonId = readString(body, "lessonId")
      const data = body.data as Record<string, unknown> | undefined
      if (!lessonId || !data) return json({ error: "lessonId and data are required" }, { status: 400 })
      return json({ row: await service.updateLesson(user.id, lessonId, data) })
    }
    if (action === "admin-delete-lesson") {
      const lessonId = readString(body, "lessonId")
      if (!lessonId) return json({ error: "lessonId is required" }, { status: 400 })
      return json(await service.deleteLesson(user.id, lessonId))
    }
    if (action === "admin-reorder-lessons") {
      const courseId = readString(body, "courseId")
      const lessonIds = Array.isArray(body.lessonIds) ? body.lessonIds.map(String) : []
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 })
      return json({ rows: await service.reorderLessons(user.id, courseId, lessonIds) })
    }
    if (action === "admin-link-question-to-lesson") {
      const lessonId = readString(body, "lessonId")
      const questionRef = readString(body, "questionRef") ?? readString(body, "questionId")
      if (!lessonId || !questionRef) return json({ error: "lessonId and questionRef are required" }, { status: 400 })
      return json({
        row: await service.linkQuestionToLesson(user.id, lessonId, questionRef, readNumber(body, "sortOrder")),
      })
    }
    if (action === "admin-unlink-question-from-lesson") {
      const lessonQuestionId = readString(body, "lessonQuestionId")
      if (!lessonQuestionId) return json({ error: "lessonQuestionId is required" }, { status: 400 })
      return json(await service.unlinkQuestionFromLesson(user.id, lessonQuestionId))
    }
    if (action === "admin-list-lesson-questions") {
      const lessonId = readString(body, "lessonId")
      if (!lessonId) return json({ error: "lessonId is required" }, { status: 400 })
      return json({ rows: await service.listLessonQuestions(user.id, lessonId) })
    }
    if (action === "admin-create-you-try-question") {
      return json({ row: await service.createYouTryQuestion(user.id, body) })
    }
    if (action === "admin-update-you-try-question") {
      const questionId = readString(body, "questionId")
      const data = body.data as Record<string, unknown> | undefined
      if (!questionId || !data) return json({ error: "questionId and data are required" }, { status: 400 })
      return json({ row: await service.updateYouTryQuestion(user.id, questionId, data) })
    }
    if (action === "admin-list-you-try-questions") {
      return json({ rows: await service.listYouTryQuestions(user.id) })
    }
    if (action === "admin-get-you-try-question") {
      const questionId = readString(body, "questionId")
      if (!questionId) return json({ error: "questionId is required" }, { status: 400 })
      return json({ row: await service.getYouTryQuestion(user.id, questionId) })
    }
    if (action === "admin-get-platform-config") {
      return json({ row: await service.getPlatformConfig(user.id) })
    }
    if (action === "admin-upsert-platform-config") {
      const data = body.data as Record<string, unknown> | undefined
      if (!data) return json({ error: "data is required" }, { status: 400 })
      return json({ row: await service.upsertPlatformConfig(user.id, data) })
    }
    if (action === "admin-list-score-tables") {
      return json({ rows: await service.listScoreTables(user.id) })
    }
    if (action === "admin-get-score-table") {
      const scoreTableId = readString(body, "scoreTableId")
      if (!scoreTableId) return json({ error: "scoreTableId is required" }, { status: 400 })
      return json({ row: await service.getScoreTable(user.id, scoreTableId) })
    }
    if (action === "admin-update-score-row") {
      const scoreRowId = readString(body, "scoreRowId")
      const data = body.data as Record<string, unknown> | undefined
      if (!scoreRowId || !data) return json({ error: "scoreRowId and data are required" }, { status: 400 })
      return json({ row: await service.updateScoreRow(user.id, scoreRowId, data) })
    }
    if (action === "admin-create-user") {
      const email = readString(body, "email")
      const password = readString(body, "password")
      const fullName = readString(body, "fullName")
      const roleRaw = readString(body, "role")
      const role = roleRaw === "admin" || roleRaw === "student" ? roleRaw : undefined
      if (!email || !password) return json({ error: "email and password are required" }, { status: 400 })
      return json({
        row: await service.createUser(user.id, {
          email,
          password,
          fullName,
          role,
        }),
      })
    }
    if (action === "admin-list-users") {
      return json({ rows: await service.listUsers(user.id, readNumber(body, "limit") ?? 100) })
    }
    if (action === "admin-get-user-detail") {
      const userId = readString(body, "userId")
      if (!userId) return json({ error: "userId is required" }, { status: 400 })
      return json(await service.getUserDetail(user.id, userId))
    }

    return json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return json({ error: error.message }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : "Internal error"
    console.error(error)
    return json({ error: message }, { status: 500 })
  }
}
