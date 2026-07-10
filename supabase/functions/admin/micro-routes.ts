import { createClient } from "npm:@supabase/supabase-js@2"
import { coercePrepLessonType } from "../_shared/prep-lesson-type.ts"
import { CORS_EDGE_NARROW, json } from "../_shared/edge-http.ts"
import { createAdminRepository, createServiceRoleClient } from "./admin.repository.ts"
import { AuthorizationError, createAdminService } from "./admin.service.ts"

const corsHeaders = CORS_EDGE_NARROW

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

/**
 * Dispatches a single admin operation (no `action` in body — slug is fixed per Edge Function).
 */
export async function handleAdminMicro(req: Request, slug: string): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 }, corsHeaders)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Server misconfigured" }, { status: 500 }, corsHeaders)
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: "Unauthorized" }, { status: 401 }, corsHeaders)

  const service = createAdminService({
    repository: createAdminRepository(createServiceRoleClient()),
  })

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const action = slug

    if (action === "admin-bootstrap-projection") {
      return json(await service.bootstrapProjection(user.id), {}, corsHeaders)
    }
    if (action === "admin-list-question-types") {
      return json({ rows: await service.listQuestionTypes() }, {}, corsHeaders)
    }
    if (action === "admin-create-question-type") {
      const name = readString(body, "name")
      const sectionType = readString(body, "sectionType") as "LR" | "RC" | "LG" | undefined
      if (!name || !sectionType) return json({ error: "name and sectionType are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.createQuestionType(user.id, {
          name,
          sectionType,
          avgPerTest: readNumber(body, "avgPerTest"),
          goalAccuracy: readNumber(body, "goalAccuracy"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-update-question-type") {
      const id = readString(body, "id")
      if (!id) return json({ error: "id is required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.updateQuestionType(user.id, id, {
          name: readString(body, "name"),
          avgPerTest: readNumber(body, "avgPerTest") ?? null,
          goalAccuracy: readNumber(body, "goalAccuracy") ?? null,
          isActive: readBoolean(body, "isActive"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-deactivate-question-type") {
      const id = readString(body, "id")
      if (!id) return json({ error: "id is required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.deactivateQuestionType(user.id, id) }, {}, corsHeaders)
    }
    if (action === "admin-seed-default-question-types") {
      return json(await service.seedDefaultQuestionTypes(user.id), {}, corsHeaders)
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
      }, {}, corsHeaders)
    }
    if (action === "admin-get-preptest-detail") {
      const prepTestId = readString(body, "prepTestId")
      if (!prepTestId) return json({ error: "prepTestId is required" }, { status: 400 }, corsHeaders)
      return json(await service.getPrepTestDetail(user.id, prepTestId), {}, corsHeaders)
    }
    if (action === "admin-get-next-question-for-preptest") {
      const prepTestId = readString(body, "prepTestId")
      if (!prepTestId) return json({ error: "prepTestId is required" }, { status: 400 }, corsHeaders)
      return json(await service.getNextQuestionForPrepTest(user.id, prepTestId), {}, corsHeaders)
    }
    if (action === "admin-get-question-editor-payload") {
      const questionId = readString(body, "questionId")
      if (!questionId) return json({ error: "questionId is required" }, { status: 400 }, corsHeaders)
      return json(await service.getQuestionEditorPayload(user.id, questionId), {}, corsHeaders)
    }
    if (action === "admin-update-question-meta") {
      const questionId = readString(body, "questionId")
      const data = body.data as Record<string, unknown> | undefined
      if (!questionId || !data) return json({ error: "questionId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateQuestionMeta(user.id, questionId, data) }, {}, corsHeaders)
    }
    if (action === "admin-reserve-question-video-upload") {
      const questionId = readString(body, "questionId")
      const fileExtension = readString(body, "fileExtension")
      if (!questionId || !fileExtension) {
        return json({ error: "questionId and fileExtension are required" }, { status: 400 }, corsHeaders)
      }
      try {
        return json(await service.reserveQuestionVideoUpload(user.id, questionId, fileExtension), {}, corsHeaders)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Reserve failed"
        if (msg === "Question not found") return json({ error: msg }, { status: 404 }, corsHeaders)
        if (msg.startsWith("Invalid file extension")) return json({ error: msg }, { status: 400 }, corsHeaders)
        throw e
      }
    }
    if (action === "admin-dashboard") {
      return json(await service.getDashboard(user.id), {}, corsHeaders)
    }
    if (action === "admin-list-courses") {
      return json({ rows: await service.listCourses(user.id) }, {}, corsHeaders)
    }
    if (action === "admin-bulk-import-dry-run") {
      const courseId = readString(body, "courseId")
      const fileName = readString(body, "fileName")
      const fileBytesBase64 = readString(body, "fileBytesBase64")
      if (!fileName || !fileBytesBase64) {
        return json({ error: "fileName and fileBytesBase64 are required" }, { status: 400 }, corsHeaders)
      }
      return json(
        await service.bulkImportDryRun(user.id, {
          courseId,
          fileName,
          fileBytesBase64,
          insertOnly: readBoolean(body, "insertOnly"),
        }),
        {},
        corsHeaders,
      )
    }
    if (action === "admin-bulk-import-commit") {
      const courseId = readString(body, "courseId")
      const importToken = readString(body, "importToken")
      if (!importToken) {
        return json({ error: "importToken is required" }, { status: 400 }, corsHeaders)
      }
      return json(await service.bulkImportCommit(user.id, { courseId, importToken }), {}, corsHeaders)
    }
    if (action === "admin-create-course") {
      const title = readString(body, "title")
      const slug = readString(body, "slug")
      if (!title || !slug) return json({ error: "title and slug are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.createCourse(user.id, {
          title,
          slug,
          description: readString(body, "description"),
          isPublished: readBoolean(body, "isPublished"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-update-course") {
      const courseId = readString(body, "courseId")
      const data = body.data as Record<string, unknown> | undefined
      if (!courseId || !data) return json({ error: "courseId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateCourse(user.id, courseId, data) }, {}, corsHeaders)
    }
    if (action === "admin-delete-course") {
      const courseId = readString(body, "courseId")
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 }, corsHeaders)
      return json(await service.deleteCourse(user.id, courseId), {}, corsHeaders)
    }
    if (action === "admin-list-lessons") {
      const courseId = readString(body, "courseId")
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 }, corsHeaders)
      return json({ rows: await service.listLessons(user.id, courseId) }, {}, corsHeaders)
    }
    if (action === "admin-list-curriculum") {
      const courseId = readString(body, "courseId")
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 }, corsHeaders)
      return json(await service.listCurriculum(user.id, courseId), {}, corsHeaders)
    }
    if (action === "admin-create-module") {
      const courseId = readString(body, "courseId")
      const title = readString(body, "title")
      if (!courseId || !title) return json({ error: "courseId and title are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.createModule(user.id, {
          courseId,
          title,
          durationMinutes: readNumber(body, "durationMinutes"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-update-module") {
      const moduleId = readString(body, "moduleId")
      const data = body.data as Record<string, unknown> | undefined
      if (!moduleId || !data) return json({ error: "moduleId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateModule(user.id, moduleId, data) }, {}, corsHeaders)
    }
    if (action === "admin-delete-module") {
      const moduleId = readString(body, "moduleId")
      if (!moduleId) return json({ error: "moduleId is required" }, { status: 400 }, corsHeaders)
      return json(await service.deleteModule(user.id, moduleId), {}, corsHeaders)
    }
    if (action === "admin-reorder-modules") {
      const courseId = readString(body, "courseId")
      const moduleIds = Array.isArray(body.moduleIds) ? body.moduleIds.map(String) : []
      if (!courseId) return json({ error: "courseId is required" }, { status: 400 }, corsHeaders)
      return json({ rows: await service.reorderModules(user.id, courseId, moduleIds) }, {}, corsHeaders)
    }
    if (action === "admin-create-section") {
      const moduleId = readString(body, "moduleId")
      const title = readString(body, "title")
      if (!moduleId || !title) return json({ error: "moduleId and title are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.createSection(user.id, {
          moduleId,
          title,
          durationMinutes: readNumber(body, "durationMinutes"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-update-section") {
      const sectionId = readString(body, "sectionId")
      const data = body.data as Record<string, unknown> | undefined
      if (!sectionId || !data) return json({ error: "sectionId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateSection(user.id, sectionId, data) }, {}, corsHeaders)
    }
    if (action === "admin-delete-section") {
      const sectionId = readString(body, "sectionId")
      if (!sectionId) return json({ error: "sectionId is required" }, { status: 400 }, corsHeaders)
      return json(await service.deleteSection(user.id, sectionId), {}, corsHeaders)
    }
    if (action === "admin-reorder-sections") {
      const moduleId = readString(body, "moduleId")
      const sectionIds = Array.isArray(body.sectionIds) ? body.sectionIds.map(String) : []
      if (!moduleId) return json({ error: "moduleId is required" }, { status: 400 }, corsHeaders)
      return json({ rows: await service.reorderSections(user.id, moduleId, sectionIds) }, {}, corsHeaders)
    }
    if (action === "admin-create-lesson") {
      const courseId = readString(body, "courseId")
      const sectionId = readString(body, "sectionId")
      const title = readString(body, "title")
      const slug = readString(body, "slug")
      if (!courseId || !sectionId || !title || !slug) {
        return json({ error: "courseId, sectionId, title and slug are required" }, { status: 400 }, corsHeaders)
      }
      return json({
        row: await service.createLesson(user.id, {
          courseId,
          sectionId,
          title,
          slug,
          summary: readString(body, "summary"),
          durationMinutes: readNumber(body, "durationMinutes"),
          lessonType: coercePrepLessonType(readString(body, "lessonType")),
          videoUrl: readString(body, "videoUrl"),
          textContent: readString(body, "textContent"),
          isPublished: readBoolean(body, "isPublished"),
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-update-lesson") {
      const lessonId = readString(body, "lessonId")
      const data = body.data as Record<string, unknown> | undefined
      if (!lessonId || !data) return json({ error: "lessonId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateLesson(user.id, lessonId, data) }, {}, corsHeaders)
    }
    if (action === "admin-delete-lesson") {
      const lessonId = readString(body, "lessonId")
      if (!lessonId) return json({ error: "lessonId is required" }, { status: 400 }, corsHeaders)
      return json(await service.deleteLesson(user.id, lessonId), {}, corsHeaders)
    }
    if (action === "admin-reorder-lessons") {
      const sectionId = readString(body, "sectionId")
      const lessonIds = Array.isArray(body.lessonIds) ? body.lessonIds.map(String) : []
      if (!sectionId) return json({ error: "sectionId is required" }, { status: 400 }, corsHeaders)
      return json({ rows: await service.reorderLessons(user.id, sectionId, lessonIds) }, {}, corsHeaders)
    }
    if (action === "admin-link-question-to-lesson") {
      const lessonId = readString(body, "lessonId")
      const questionRef = readString(body, "questionRef") ?? readString(body, "questionId")
      if (!lessonId || !questionRef) return json({ error: "lessonId and questionRef are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.linkQuestionToLesson(user.id, lessonId, questionRef, readNumber(body, "sortOrder")),
      }, {}, corsHeaders)
    }
    if (action === "admin-unlink-question-from-lesson") {
      const lessonQuestionId = readString(body, "lessonQuestionId")
      if (!lessonQuestionId) return json({ error: "lessonQuestionId is required" }, { status: 400 }, corsHeaders)
      return json(await service.unlinkQuestionFromLesson(user.id, lessonQuestionId), {}, corsHeaders)
    }
    if (action === "admin-list-lesson-questions") {
      const lessonId = readString(body, "lessonId")
      if (!lessonId) return json({ error: "lessonId is required" }, { status: 400 }, corsHeaders)
      return json({ rows: await service.listLessonQuestions(user.id, lessonId) }, {}, corsHeaders)
    }
    if (action === "admin-create-you-try-question") {
      return json({ row: await service.createYouTryQuestion(user.id, body) }, {}, corsHeaders)
    }
    if (action === "admin-update-you-try-question") {
      const questionId = readString(body, "questionId")
      const data = body.data as Record<string, unknown> | undefined
      if (!questionId || !data) return json({ error: "questionId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateYouTryQuestion(user.id, questionId, data) }, {}, corsHeaders)
    }
    if (action === "admin-list-you-try-questions") {
      return json({ rows: await service.listYouTryQuestions(user.id) }, {}, corsHeaders)
    }
    if (action === "admin-get-you-try-question") {
      const questionId = readString(body, "questionId")
      if (!questionId) return json({ error: "questionId is required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.getYouTryQuestion(user.id, questionId) }, {}, corsHeaders)
    }
    if (action === "admin-get-platform-config") {
      return json({ row: await service.getPlatformConfig(user.id) }, {}, corsHeaders)
    }
    if (action === "admin-upsert-platform-config") {
      const data = body.data as Record<string, unknown> | undefined
      if (!data) return json({ error: "data is required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.upsertPlatformConfig(user.id, data) }, {}, corsHeaders)
    }
    if (action === "admin-list-score-tables") {
      return json({ rows: await service.listScoreTables(user.id) }, {}, corsHeaders)
    }
    if (action === "admin-get-score-table") {
      const scoreTableId = readString(body, "scoreTableId")
      if (!scoreTableId) return json({ error: "scoreTableId is required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.getScoreTable(user.id, scoreTableId) }, {}, corsHeaders)
    }
    if (action === "admin-update-score-row") {
      const scoreRowId = readString(body, "scoreRowId")
      const data = body.data as Record<string, unknown> | undefined
      if (!scoreRowId || !data) return json({ error: "scoreRowId and data are required" }, { status: 400 }, corsHeaders)
      return json({ row: await service.updateScoreRow(user.id, scoreRowId, data) }, {}, corsHeaders)
    }
    if (action === "admin-create-user") {
      const email = readString(body, "email")
      const password = readString(body, "password")
      const fullName = readString(body, "fullName")
      const roleRaw = readString(body, "role")
      const role = roleRaw === "admin" || roleRaw === "student" ? roleRaw : undefined
      if (!email || !password) return json({ error: "email and password are required" }, { status: 400 }, corsHeaders)
      return json({
        row: await service.createUser(user.id, {
          email,
          password,
          fullName,
          role,
        }),
      }, {}, corsHeaders)
    }
    if (action === "admin-list-users") {
      return json({ rows: await service.listUsers(user.id, readNumber(body, "limit") ?? 100) }, {}, corsHeaders)
    }
    if (action === "admin-get-user-detail") {
      const userId = readString(body, "userId")
      if (!userId) return json({ error: "userId is required" }, { status: 400 }, corsHeaders)
      return json(await service.getUserDetail(user.id, userId), {}, corsHeaders)
    }

    return json({ error: "Unknown admin slug" }, { status: 400 }, corsHeaders)
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return json({ error: error.message }, { status: 403 }, corsHeaders)
    }
    const message = error instanceof Error ? error.message : "Internal error"
    console.error(error)
    return json({ error: message }, { status: 500 }, corsHeaders)
  }
}
