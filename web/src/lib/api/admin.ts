import type { SupabaseClient } from "@supabase/supabase-js"

type InvokeOptions = Parameters<SupabaseClient["functions"]["invoke"]>[1]

export type AdminQuestionType = {
  id: string
  name: string
  section_type: "LR" | "RC" | "LG"
  avg_per_test: number | null
  goal_accuracy: number | null
  is_active: boolean
}

export type AdminBulkImportPreviewRow = {
  lesson_slug: string
  lesson_title: string
  lesson_type: "video_text" | "active_drill" | "adaptive_drill" | "rep_work"
  sort_order: number
  summary: string | null
  duration_minutes: number | null
  video_url: string | null
  text_content: string
  lesson_is_published: boolean
  status: "insert" | "update" | "invalid"
  errors: string[]
}

export type PrepCourseModuleRow = {
  id: string
  course_id: string
  title: string
  sort_order: number
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export type PrepCourseSectionRow = {
  id: string
  module_id: string
  title: string
  sort_order: number
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export type PrepCourseLessonRow = {
  id: string
  course_id: string
  section_id: string
  slug: string
  title: string
  summary: string | null
  video_url: string | null
  text_content: string | null
  duration_minutes: number | null
  lesson_type: "video_text" | "active_drill" | "adaptive_drill" | "rep_work"
  is_published: boolean
  sort_order: number
}

export type PrepCourseSectionWithLessons = PrepCourseSectionRow & {
  lessons: PrepCourseLessonRow[]
}

export type PrepCourseModuleWithSections = PrepCourseModuleRow & {
  sections: PrepCourseSectionWithLessons[]
}

export type PrepCourseCurriculum = {
  modules: PrepCourseModuleWithSections[]
}

export type AdminBulkImportDryRunResult = {
  course: {
    id: string | null
    slug: string
    title: string
    description: string | null
    is_published: boolean
  }
  importToken: string
  expiresAt: string
  counts: {
    totalRows: number
    insertCount: number
    updateCount: number
    invalidCount: number
    validCount: number
  }
  rows: AdminBulkImportPreviewRow[]
}

export function createAdminApi(supabase: SupabaseClient) {
  async function invokeAdminFn<T>(
    functionName: string,
    options: InvokeOptions,
  ): Promise<{ data: T | null; error: unknown }> {
    const maybeAuth = (supabase as unknown as {
      auth?: { getSession?: () => Promise<{ data: { session: { access_token?: string } | null } }> }
    }).auth
    const sessionResult = maybeAuth?.getSession ? await maybeAuth.getSession() : null
    const accessToken = sessionResult?.data?.session?.access_token
    const baseHeaders = (options?.headers as Record<string, string> | undefined) ?? undefined
    const headers = baseHeaders ? { ...baseHeaders } : undefined
    if (accessToken) {
      const nextHeaders = headers ?? {}
      nextHeaders.Authorization = `Bearer ${accessToken}`
      return supabase.functions.invoke<T>(functionName, { ...options, headers: nextHeaders })
    }
    return supabase.functions.invoke<T>(functionName, options)
  }

  async function reserveQuestionVideoUploadInner(questionId: string, fileExtension: string) {
    const { data, error } = await invokeAdminFn<{ bucket: string; path: string; publicUrl: string }>(
      "admin-reserve-question-video-upload",
      {
        method: "POST",
        body: { questionId, fileExtension },
      },
    )
    if (error) throw error
    if (!data?.bucket || !data.path || !data.publicUrl) throw new Error("Invalid reserve response")
    return data
  }

  return {
    async bootstrapProjection() {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-bootstrap-projection", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.success ?? false
    },

    async listQuestionTypes() {
      const { data, error } = await invokeAdminFn<{ rows: AdminQuestionType[] }>("admin-list-question-types", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createQuestionType(payload: { name: string; sectionType: "LR" | "RC" | "LG" }) {
      const { data, error } = await invokeAdminFn<{ row: AdminQuestionType }>("admin-create-question-type", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async updateQuestionType(id: string, payload: Partial<{ name: string; isActive: boolean }>) {
      const { data, error } = await invokeAdminFn<{ row: AdminQuestionType }>("admin-update-question-type", {
        method: "POST",
        body: { id, ...payload },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async deactivateQuestionType(id: string) {
      const { data, error } = await invokeAdminFn<{ row: AdminQuestionType }>("admin-deactivate-question-type", {
        method: "POST",
        body: { id },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async seedDefaultQuestionTypes() {
      const { data, error } = await invokeAdminFn<{ seeded: number; skipped: number }>("admin-seed-default-question-types", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data ?? { seeded: 0, skipped: 0 }
    },

    async listPrepTests(limit = 10, offset = 0, contentFilter?: string) {
      const { data, error } = await invokeAdminFn<{ rows: unknown[]; total: number }>("admin-list-preptests", {
        method: "POST",
        body: { limit, offset, contentFilter },
      })
      if (error) throw error
      return {
        rows: data?.rows ?? [],
        total: data?.total ?? 0,
      }
    },

    async getPrepTestDetail(prepTestId: string) {
      const { data, error } = await invokeAdminFn<{ prepTest: unknown; stats: unknown }>("admin-get-preptest-detail", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data) throw new Error("No prep test detail returned")
      return data
    },

    async getNextQuestionForPrepTest(prepTestId: string) {
      const { data, error } = await invokeAdminFn<{
        nextQuestion: { id: string; sectionId: string; sectionNumber: number; questionNumber: number }
      }>("admin-get-next-question-for-preptest", {
        method: "POST",
        body: { prepTestId },
      })
      if (error) throw error
      if (!data?.nextQuestion) throw new Error("No question found for this PrepTest")
      return data.nextQuestion
    },

    async getQuestionEditorPayload(questionId: string) {
      const { data, error } = await invokeAdminFn<{ question: unknown; adjacent: unknown; taxonomy: AdminQuestionType[] }>(
        "admin-get-question-editor-payload",
        {
          method: "POST",
          body: { questionId },
        },
      )
      if (error) throw error
      if (!data) throw new Error("No question payload returned")
      return data
    },

    async updateQuestionMeta(questionId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-update-question-meta", {
        method: "POST",
        body: { questionId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async reserveQuestionVideoUpload(questionId: string, fileExtension: string) {
      return reserveQuestionVideoUploadInner(questionId, fileExtension)
    },

    /** Reserves a storage path (admin edge), uploads with the caller's session (RLS), returns public object URL for `video_url`. */
    async uploadQuestionVideoBlob(questionId: string, blob: Blob, contentType: string, fileExtension: string) {
      const reserved = await reserveQuestionVideoUploadInner(questionId, fileExtension)
      const { error: uploadError } = await supabase.storage.from(reserved.bucket).upload(reserved.path, blob, {
        contentType,
        upsert: true,
      })
      if (uploadError) throw uploadError
      const { data: pub } = supabase.storage.from(reserved.bucket).getPublicUrl(reserved.path)
      if (!pub?.publicUrl) throw new Error("Could not resolve public video URL")
      return pub.publicUrl
    },

    async getDashboard() {
      const { data, error } = await invokeAdminFn<{ prepTests: unknown[] }>("admin-dashboard", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.prepTests ?? []
    },

    async listCourses() {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-courses", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async bulkImportDryRun(payload: { courseId?: string; fileName: string; fileBytesBase64: string }) {
      const { data, error } = await invokeAdminFn<AdminBulkImportDryRunResult>("admin-bulk-import-dry-run", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      if (!data) throw new Error("No dry-run response returned")
      return data
    },

    async bulkImportCommit(payload: { courseId?: string; importToken: string }) {
      const { data, error } = await invokeAdminFn<{
        success: boolean
        courseId: string
        counts: { inserted: number; updated: number; upserted: number; finalLessonCount: number }
      }>("admin-bulk-import-commit", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      if (!data) throw new Error("No commit response returned")
      return data
    },

    async createCourse(payload: {
      title: string
      slug: string
      description?: string
      isPublished?: boolean
    }) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-create-course", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateCourse(courseId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdminFn<{ row: unknown }>("admin-update-course", {
        method: "POST",
        body: { courseId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteCourse(courseId: string) {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-delete-course", {
        method: "POST",
        body: { courseId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async listLessons(courseId: string) {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-lessons", {
        method: "POST",
        body: { courseId },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async listCurriculum(courseId: string): Promise<PrepCourseCurriculum> {
      const { data, error } = await invokeAdminFn<PrepCourseCurriculum>("admin-list-curriculum", {
        method: "POST",
        body: { courseId },
      })
      if (error) throw error
      return data ?? { modules: [] }
    },

    async createModule(payload: { courseId: string; title: string; durationMinutes?: number | null }) {
      const { data, error } = await invokeAdminFn<{ row: PrepCourseModuleRow }>("admin-create-module", {
        method: "POST",
        body: payload,
      })
      if (error) throw error
      return data?.row
    },

    async updateModule(moduleId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdminFn<{ row: PrepCourseModuleRow }>("admin-update-module", {
        method: "POST",
        body: { moduleId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteModule(moduleId: string) {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-delete-module", {
        method: "POST",
        body: { moduleId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async reorderModules(courseId: string, moduleIds: string[]) {
      const { data, error } = await invokeAdminFn<{ rows: PrepCourseModuleRow[] }>("admin-reorder-modules", {
        method: "POST",
        body: { courseId, moduleIds },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createSection(payload: { moduleId: string; title: string; durationMinutes?: number | null }) {
      const { data, error } = await invokeAdminFn<{ row: PrepCourseSectionRow }>("admin-create-section", {
        method: "POST",
        body: payload,
      })
      if (error) throw error
      return data?.row
    },

    async updateSection(sectionId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdminFn<{ row: PrepCourseSectionRow }>("admin-update-section", {
        method: "POST",
        body: { sectionId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteSection(sectionId: string) {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-delete-section", {
        method: "POST",
        body: { sectionId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async reorderSections(moduleId: string, sectionIds: string[]) {
      const { data, error } = await invokeAdminFn<{ rows: PrepCourseSectionRow[] }>("admin-reorder-sections", {
        method: "POST",
        body: { moduleId, sectionIds },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createLesson(payload: {
      courseId: string
      sectionId: string
      title: string
      slug: string
      summary?: string
      durationMinutes?: number
      lessonType?: "video_text" | "active_drill" | "adaptive_drill" | "rep_work"
      videoUrl?: string
      textContent?: string
      isPublished?: boolean
    }) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-create-lesson", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateLesson(lessonId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdminFn<{ row: unknown }>("admin-update-lesson", {
        method: "POST",
        body: { lessonId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteLesson(lessonId: string) {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-delete-lesson", {
        method: "POST",
        body: { lessonId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async reorderLessons(sectionId: string, lessonIds: string[]) {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-reorder-lessons", {
        method: "POST",
        body: { sectionId, lessonIds },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async listLessonQuestions(lessonId: string) {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-lesson-questions", {
        method: "POST",
        body: { lessonId },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async linkQuestionToLesson(lessonId: string, questionRef: string) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-link-question-to-lesson", {
        method: "POST",
        body: { lessonId, questionRef },
      })
      if (error) throw error
      return data?.row
    },

    async unlinkQuestionFromLesson(lessonQuestionId: string) {
      const { data, error } = await invokeAdminFn<{ success: boolean }>("admin-unlink-question-from-lesson", {
        method: "POST",
        body: { lessonQuestionId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async createYouTryQuestion(payload: Record<string, unknown>) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-create-you-try-question", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateYouTryQuestion(questionId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-update-you-try-question", {
        method: "POST",
        body: { questionId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listYouTryQuestions() {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-you-try-questions", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async getYouTryQuestion(questionId: string) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-get-you-try-question", {
        method: "POST",
        body: { questionId },
      })
      if (error) throw error
      return data?.row
    },

    async getPlatformConfig() {
      const { data, error } = await invokeAdminFn<{ row: Record<string, unknown> | null }>("admin-get-platform-config", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.row ?? null
    },

    async upsertPlatformConfig(payload: Record<string, unknown>) {
      const { data, error } = await invokeAdminFn<{ row: Record<string, unknown> }>("admin-upsert-platform-config", {
        method: "POST",
        body: { data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listScoreTables() {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-score-tables", {
        method: "POST",
        body: {},
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async getScoreTable(scoreTableId: string) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-get-score-table", {
        method: "POST",
        body: { scoreTableId },
      })
      if (error) throw error
      return data?.row
    },

    async updateScoreRow(scoreRowId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-update-score-row", {
        method: "POST",
        body: { scoreRowId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listUsers(limit = 100) {
      const { data, error } = await invokeAdminFn<{ rows: unknown[] }>("admin-list-users", {
        method: "POST",
        body: { limit },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createUser(payload: {
      email: string
      password: string
      fullName?: string
      role?: "student" | "admin"
    }) {
      const { data, error } = await invokeAdminFn<{ row: unknown }>("admin-create-user", {
        method: "POST",
        body: { ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async getUserDetail(userId: string) {
      const { data, error } = await invokeAdminFn<{ profile: unknown; tests: unknown[] }>("admin-get-user-detail", {
        method: "POST",
        body: { userId },
      })
      if (error) throw error
      if (!data) throw new Error("No user detail returned")
      return data
    },
  }
}
