import { browserFacingSupabaseApiBaseUrl } from "../_shared/browser-facing-supabase-url.ts"
import { QUESTION_EXPLANATION_VIDEOS_BUCKET } from "../_shared/question-explanation-videos.ts"
import { coercePrepLessonType, isPrepLessonType } from "../_shared/prep-lesson-type.ts"
import type { AdminRepository } from "./admin.repository.ts"

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthorizationError"
  }
}

const DEFAULT_TAXONOMY: Record<"LR" | "LG" | "RC", string[]> = {
  LR: [
    "Flaw in the reasoning",
    "Necessary assumption",
    "Sufficient assumption",
    "Strengthen the argument",
    "Weaken the argument",
    "Main point",
    "Inference / Must be true",
    "Method of reasoning",
    "Parallel reasoning",
    "Principle",
    "Resolve / Explain",
    "Point at issue",
  ],
  LG: ["Sequencing (linear)", "Grouping", "Matching", "Hybrid", "Process / Selection"],
  RC: [
    "Main point / Primary purpose",
    "Inference",
    "Author's attitude / tone",
    "Strengthen / support",
    "Passage structure / method",
    "Vocabulary in context",
    "Analogy / parallel situation",
    "Exception / EXCEPT",
  ],
}

function normalizeLessonTypeForQuestionLinking(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_")
  if (normalized === "video" || normalized === "text") return "video_text"
  return normalized
}

export function createAdminService(deps: { repository: AdminRepository }) {
  async function requireAdmin(userId: string): Promise<void> {
    const role = await deps.repository.getProfileRole(userId)
    if (role !== "admin" && role !== "super_admin") throw new AuthorizationError("Admin access required")
  }

  return {
    async bootstrapProjection(userId: string) {
      await requireAdmin(userId)
      await deps.repository.ensureAdminProjectionFromLsac()
      return { success: true }
    },

    async listQuestionTypes() {
      return deps.repository.listQuestionTypes()
    },

    async createQuestionType(
      userId: string,
      input: { name: string; sectionType: "LR" | "RC" | "LG"; avgPerTest?: number; goalAccuracy?: number },
    ) {
      await requireAdmin(userId)
      const name = input.name.trim()
      if (!name) throw new Error("name is required")
      return deps.repository.createQuestionType(input)
    },

    async updateQuestionType(
      userId: string,
      id: string,
      input: { name?: string; avgPerTest?: number | null; goalAccuracy?: number | null; isActive?: boolean },
    ) {
      await requireAdmin(userId)
      return deps.repository.updateQuestionType(id, {
        name: input.name,
        avg_per_test: input.avgPerTest ?? undefined,
        goal_accuracy: input.goalAccuracy ?? undefined,
        is_active: input.isActive,
      })
    },

    async deactivateQuestionType(userId: string, id: string) {
      await requireAdmin(userId)
      const usage = await deps.repository.questionTypeUsageCount(id)
      if (usage > 0) throw new Error(`Cannot deactivate - ${usage} questions/games use this tag`)
      return deps.repository.updateQuestionType(id, { is_active: false })
    },

    async seedDefaultQuestionTypes(userId: string) {
      await requireAdmin(userId)
      const existing = await deps.repository.listQuestionTypes()
      if (existing.length > 0) return { seeded: 0, skipped: existing.length }
      let seeded = 0
      for (const [sectionType, names] of Object.entries(DEFAULT_TAXONOMY) as Array<["LR" | "LG" | "RC", string[]]>) {
        for (const name of names) {
          await deps.repository.createQuestionType({ name, sectionType })
          seeded += 1
        }
      }
      return { seeded, skipped: 0 }
    },

    async listPrepTests(userId: string, limit = 10, offset = 0, contentFilter?: string) {
      await requireAdmin(userId)
      return deps.repository.listPrepTests(limit, offset, contentFilter)
    },

    async getPrepTestDetail(userId: string, prepTestId: string) {
      await requireAdmin(userId)
      const [prepTest, stats] = await Promise.all([
        deps.repository.getPrepTestDetail(prepTestId),
        deps.repository.getPrepTestCompletionStats(prepTestId),
      ])
      return { prepTest, stats }
    },

    async getNextQuestionForPrepTest(userId: string, prepTestId: string) {
      await requireAdmin(userId)
      const nextQuestion = await deps.repository.getNextQuestionForPrepTest(prepTestId)
      if (!nextQuestion) throw new Error("No questions found for this PrepTest")
      return { nextQuestion }
    },

    async getQuestionEditorPayload(userId: string, questionId: string) {
      await requireAdmin(userId)
      const question = await deps.repository.getQuestionEditorPayload(questionId)
      const adjacent = await deps.repository.getAdjacentQuestionIds(questionId, question.section_id)
      const taxonomy = await deps.repository.listQuestionTypes()
      return {
        question,
        adjacent,
        sectionOptions: Array.isArray(question.sectionOptions) ? question.sectionOptions : [],
        taxonomy: taxonomy.filter((row) => row.is_active),
      }
    },

    async updateQuestionMeta(userId: string, questionId: string, patch: Record<string, unknown>) {
      await requireAdmin(userId)
      return deps.repository.updateQuestionMeta(questionId, patch)
    },

    async reserveQuestionVideoUpload(userId: string, questionId: string, fileExtension: string) {
      await requireAdmin(userId)
      const ext = fileExtension.replace(/^\./, "").trim().toLowerCase()
      const allowed = new Set(["webm", "mp4", "mov", "m4v", "mkv"])
      if (!allowed.has(ext)) {
        throw new Error("Invalid file extension; use webm, mp4, mov, m4v, or mkv")
      }
      const exists = await deps.repository.adminQuestionExists(questionId)
      if (!exists) throw new Error("Question not found")
      const path = `${questionId}/${crypto.randomUUID()}.${ext}`
      const supabaseUrl = browserFacingSupabaseApiBaseUrl()
      if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured")
      const encodedPath = path.split("/").map(encodeURIComponent).join("/")
      const publicUrl =
        `${supabaseUrl}/storage/v1/object/public/${QUESTION_EXPLANATION_VIDEOS_BUCKET}/${encodedPath}`
      return {
        bucket: QUESTION_EXPLANATION_VIDEOS_BUCKET,
        path,
        publicUrl,
      }
    },

    async getDashboard(userId: string) {
      await requireAdmin(userId)
      const { rows: prepTests } = await deps.repository.listPrepTests()
      const rows = await Promise.all(
        prepTests.map(async (prepTest) => {
          const stats = await deps.repository.getPrepTestCompletionStats(String(prepTest.id))
          return { ...prepTest, stats }
        }),
      )
      return { prepTests: rows }
    },

    async listCourses(userId: string) {
      await requireAdmin(userId)
      return deps.repository.listCourses()
    },

    async createCourse(
      userId: string,
      input: {
        title: string
        slug: string
        description?: string
        isPublished?: boolean
      },
    ) {
      await requireAdmin(userId)
      return deps.repository.createCourse({
        title: input.title.trim(),
        slug: input.slug.trim(),
        description: input.description?.trim() || null,
        isPublished: input.isPublished,
      })
    },

    async updateCourse(userId: string, courseId: string, input: Record<string, unknown>) {
      await requireAdmin(userId)
      const patch: Record<string, unknown> = {}
      if (typeof input.title === "string") patch.title = input.title.trim()
      if (typeof input.slug === "string") patch.slug = input.slug.trim()
      if (typeof input.description === "string") patch.description = input.description.trim()
      if (input.description === null) patch.description = null
      if (typeof input.isPublished === "boolean") patch.is_published = input.isPublished
      return deps.repository.updateCourse(courseId, patch)
    },

    async deleteCourse(userId: string, courseId: string) {
      await requireAdmin(userId)
      return deps.repository.deleteCourse(courseId)
    },

    async listLessons(userId: string, courseId: string) {
      await requireAdmin(userId)
      return deps.repository.listLessons(courseId)
    },

    async createLesson(
      userId: string,
      input: {
        courseId: string
        title: string
        slug: string
        summary?: string
        durationMinutes?: number
        lessonType?: string
        videoUrl?: string
        textContent?: string
        isPublished?: boolean
      },
    ) {
      await requireAdmin(userId)
      return deps.repository.createLesson({
        courseId: input.courseId,
        title: input.title.trim(),
        slug: input.slug.trim(),
        summary: input.summary?.trim() || null,
        durationMinutes: typeof input.durationMinutes === "number" ? input.durationMinutes : null,
        lessonType: coercePrepLessonType(input.lessonType),
        videoUrl: input.videoUrl?.trim() || null,
        textContent: input.textContent?.trim() || "Draft lesson content",
        isPublished: input.isPublished,
      })
    },

    async updateLesson(userId: string, lessonId: string, input: Record<string, unknown>) {
      await requireAdmin(userId)
      const patch: Record<string, unknown> = {}
      if (typeof input.title === "string") patch.title = input.title.trim()
      if (typeof input.slug === "string") patch.slug = input.slug.trim()
      if (typeof input.summary === "string") patch.summary = input.summary.trim()
      if (input.summary === null) patch.summary = null
      if (typeof input.durationMinutes === "number") patch.duration_minutes = input.durationMinutes
      if (input.durationMinutes === null) patch.duration_minutes = null
      if (typeof input.lessonType === "string") {
        if (!isPrepLessonType(input.lessonType)) {
          throw new Error("Invalid lessonType")
        }
        patch.lesson_type = input.lessonType
      }
      if (typeof input.videoUrl === "string") patch.video_url = input.videoUrl.trim()
      if (input.videoUrl === null) patch.video_url = null
      if (typeof input.textContent === "string") patch.text_content = input.textContent
      if (typeof input.isPublished === "boolean") patch.is_published = input.isPublished
      return deps.repository.updateLesson(lessonId, patch)
    },

    async deleteLesson(userId: string, lessonId: string) {
      await requireAdmin(userId)
      return deps.repository.deleteLesson(lessonId)
    },

    async reorderLessons(userId: string, courseId: string, lessonIds: string[]) {
      await requireAdmin(userId)
      return deps.repository.reorderLessons(courseId, lessonIds)
    },

    async linkQuestionToLesson(userId: string, lessonId: string, questionRef: string, sortOrder?: number) {
      await requireAdmin(userId)
      const lessonType = await deps.repository.getLessonLessonType(lessonId)
      if (!lessonType) throw new Error("Lesson not found")
      const normalizedLessonType = normalizeLessonTypeForQuestionLinking(lessonType)
      const questionId = await deps.repository.resolveQuestionIdFromReference(questionRef)
      if (!questionId) {
        throw new Error("Question not found. Use UUID or format: PT 92 · S2 · Q4")
      }
      const questionSource = await deps.repository.getQuestionSourceById(questionId)
      // Keep strict lesson-type limits for LSAC PrepTest content only.
      if (questionSource !== "PLATFORM") {
        if (normalizedLessonType === "video_text" || normalizedLessonType === "rep_work") {
          throw new Error("This lesson type does not support linking PrepTest questions.")
        }
        const linkedCount = await deps.repository.countLessonQuestions(lessonId)
        if (normalizedLessonType === "active_drill" && linkedCount >= 1) {
          throw new Error("Active drill lessons can only include one linked question.")
        }
        if (normalizedLessonType === "adaptive_drill" && linkedCount >= 5) {
          throw new Error("Adaptive drill lessons can include at most five linked questions.")
        }
      }
      return deps.repository.linkQuestionToLesson({ lessonId, questionId, sortOrder })
    },

    async unlinkQuestionFromLesson(userId: string, lessonQuestionId: string) {
      await requireAdmin(userId)
      return deps.repository.unlinkQuestionFromLesson(lessonQuestionId)
    },

    async listLessonQuestions(userId: string, lessonId: string) {
      await requireAdmin(userId)
      return deps.repository.listLessonQuestions(lessonId)
    },

    async createYouTryQuestion(userId: string, payload: Record<string, unknown>) {
      await requireAdmin(userId)
      return deps.repository.createYouTryQuestion(payload)
    },

    async updateYouTryQuestion(userId: string, questionId: string, payload: Record<string, unknown>) {
      await requireAdmin(userId)
      return deps.repository.updateYouTryQuestion(questionId, payload)
    },

    async listYouTryQuestions(userId: string) {
      await requireAdmin(userId)
      return deps.repository.listYouTryQuestions()
    },

    async getYouTryQuestion(userId: string, questionId: string) {
      await requireAdmin(userId)
      return deps.repository.getYouTryQuestion(questionId)
    },

    async getPlatformConfig(userId: string) {
      await requireAdmin(userId)
      return deps.repository.getPlatformConfig()
    },

    async upsertPlatformConfig(userId: string, payload: Record<string, unknown>) {
      await requireAdmin(userId)
      return deps.repository.upsertPlatformConfig(payload)
    },

    async listScoreTables(userId: string) {
      await requireAdmin(userId)
      return deps.repository.listScoreTables()
    },

    async getScoreTable(userId: string, scoreTableId: string) {
      await requireAdmin(userId)
      return deps.repository.getScoreTable(scoreTableId)
    },

    async updateScoreRow(userId: string, scoreRowId: string, payload: Record<string, unknown>) {
      await requireAdmin(userId)
      return deps.repository.updateScoreRow(scoreRowId, payload)
    },

    async createUser(
      userId: string,
      input: { email: string; password: string; fullName?: string | null; role?: "student" | "admin" },
    ) {
      await requireAdmin(userId)
      const email = input.email.trim().toLowerCase()
      if (!email) throw new Error("email is required")
      if (!input.password || input.password.trim().length < 8) {
        throw new Error("password must be at least 8 characters")
      }
      return deps.repository.createUser({
        email,
        password: input.password,
        fullName: input.fullName?.trim() || null,
        role: input.role === "admin" ? "admin" : "student",
      })
    },

    async listUsers(userId: string, limit: number) {
      await requireAdmin(userId)
      return deps.repository.listUsers(limit)
    },

    async getUserDetail(userId: string, targetUserId: string) {
      await requireAdmin(userId)
      return deps.repository.getUserDetail(targetUserId)
    },
  }
}

export type AdminService = ReturnType<typeof createAdminService>
