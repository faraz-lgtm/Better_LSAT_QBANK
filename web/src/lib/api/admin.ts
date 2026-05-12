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
  async function invokeAdmin<T>(options: InvokeOptions): Promise<{ data: T | null; error: unknown }> {
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
      return supabase.functions.invoke<T>("admin", { ...options, headers: nextHeaders })
    }
    return supabase.functions.invoke<T>("admin", options)
  }

  async function reserveQuestionVideoUploadInner(questionId: string, fileExtension: string) {
    const { data, error } = await invokeAdmin<{ bucket: string; path: string; publicUrl: string }>({
      method: "POST",
      body: { action: "admin-reserve-question-video-upload", questionId, fileExtension },
    })
    if (error) throw error
    if (!data?.bucket || !data.path || !data.publicUrl) throw new Error("Invalid reserve response")
    return data
  }

  async function reserveLessonVideoUploadInner(lessonId: string, fileExtension: string) {
    const { data, error } = await invokeAdmin<{ bucket: string; path: string; publicUrl: string }>({
      method: "POST",
      body: { action: "admin-reserve-lesson-video-upload", lessonId, fileExtension },
    })
    if (error) throw error
    if (!data?.bucket || !data.path || !data.publicUrl) throw new Error("Invalid reserve response")
    return data
  }

  return {
    async bootstrapProjection() {
      const { data, error } = await invokeAdmin<{ success: boolean }>({
        method: "POST",
        body: { action: "admin-bootstrap-projection" },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async listQuestionTypes() {
      const { data, error } = await invokeAdmin<{ rows: AdminQuestionType[] }>({
        method: "POST",
        body: { action: "admin-list-question-types" },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createQuestionType(payload: { name: string; sectionType: "LR" | "RC" | "LG" }) {
      const { data, error } = await invokeAdmin<{ row: AdminQuestionType }>({
        method: "POST",
        body: { action: "admin-create-question-type", ...payload },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async updateQuestionType(id: string, payload: Partial<{ name: string; isActive: boolean }>) {
      const { data, error } = await invokeAdmin<{ row: AdminQuestionType }>({
        method: "POST",
        body: { action: "admin-update-question-type", id, ...payload },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async deactivateQuestionType(id: string) {
      const { data, error } = await invokeAdmin<{ row: AdminQuestionType }>({
        method: "POST",
        body: { action: "admin-deactivate-question-type", id },
      })
      if (error) throw error
      if (!data?.row) throw new Error("No taxonomy row returned")
      return data.row
    },

    async seedDefaultQuestionTypes() {
      const { data, error } = await invokeAdmin<{ seeded: number; skipped: number }>({
        method: "POST",
        body: { action: "admin-seed-default-question-types" },
      })
      if (error) throw error
      return data ?? { seeded: 0, skipped: 0 }
    },

    async listPrepTests(limit = 10, offset = 0, contentFilter?: string) {
      const { data, error } = await invokeAdmin<{ rows: unknown[]; total: number }>({
        method: "POST",
        body: { action: "admin-list-preptests", limit, offset, contentFilter },
      })
      if (error) throw error
      return {
        rows: data?.rows ?? [],
        total: data?.total ?? 0,
      }
    },

    async getPrepTestDetail(prepTestId: string) {
      const { data, error } = await invokeAdmin<{ prepTest: unknown; stats: unknown }>({
        method: "POST",
        body: { action: "admin-get-preptest-detail", prepTestId },
      })
      if (error) throw error
      if (!data) throw new Error("No prep test detail returned")
      return data
    },

    async getNextQuestionForPrepTest(prepTestId: string) {
      const { data, error } = await invokeAdmin<{
        nextQuestion: { id: string; sectionId: string; sectionNumber: number; questionNumber: number }
      }>({
        method: "POST",
        body: { action: "admin-get-next-question-for-preptest", prepTestId },
      })
      if (error) throw error
      if (!data?.nextQuestion) throw new Error("No question found for this PrepTest")
      return data.nextQuestion
    },

    async getQuestionEditorPayload(questionId: string) {
      const { data, error } = await invokeAdmin<{ question: unknown; adjacent: unknown; taxonomy: AdminQuestionType[] }>({
        method: "POST",
        body: { action: "admin-get-question-editor-payload", questionId },
      })
      if (error) throw error
      if (!data) throw new Error("No question payload returned")
      return data
    },

    async updateQuestionMeta(questionId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-update-question-meta", questionId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async reserveQuestionVideoUpload(questionId: string, fileExtension: string) {
      return reserveQuestionVideoUploadInner(questionId, fileExtension)
    },

    async reserveLessonVideoUpload(lessonId: string, fileExtension: string) {
      return reserveLessonVideoUploadInner(lessonId, fileExtension)
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

    async uploadLessonVideoBlob(lessonId: string, blob: Blob, contentType: string, fileExtension: string) {
      const reserved = await reserveLessonVideoUploadInner(lessonId, fileExtension)
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
      const { data, error } = await invokeAdmin<{ prepTests: unknown[] }>({
        method: "POST",
        body: { action: "admin-dashboard" },
      })
      if (error) throw error
      return data?.prepTests ?? []
    },

    async listCourses() {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-courses" },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async bulkImportDryRun(payload: { courseId?: string; fileName: string; fileBytesBase64: string }) {
      const { data, error } = await invokeAdmin<AdminBulkImportDryRunResult>({
        method: "POST",
        body: { action: "admin-bulk-import-dry-run", ...payload },
      })
      if (error) throw error
      if (!data) throw new Error("No dry-run response returned")
      return data
    },

    async bulkImportCommit(payload: { courseId?: string; importToken: string }) {
      const { data, error } = await invokeAdmin<{
        success: boolean
        courseId: string
        counts: { inserted: number; updated: number; upserted: number; finalLessonCount: number }
      }>({
        method: "POST",
        body: { action: "admin-bulk-import-commit", ...payload },
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
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-create-course", ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateCourse(courseId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-update-course", courseId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteCourse(courseId: string) {
      const { data, error } = await invokeAdmin<{ success: boolean }>({
        method: "POST",
        body: { action: "admin-delete-course", courseId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async listLessons(courseId: string) {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-lessons", courseId },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async createLesson(payload: {
      courseId: string
      title: string
      slug: string
      summary?: string
      durationMinutes?: number
      lessonType?: "video_text" | "active_drill" | "adaptive_drill" | "rep_work"
      videoUrl?: string
      textContent?: string
      isPublished?: boolean
    }) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-create-lesson", ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateLesson(lessonId: string, data: Record<string, unknown>) {
      const { data: out, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-update-lesson", lessonId, data },
      })
      if (error) throw error
      return out?.row
    },

    async deleteLesson(lessonId: string) {
      const { data, error } = await invokeAdmin<{ success: boolean }>({
        method: "POST",
        body: { action: "admin-delete-lesson", lessonId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async reorderLessons(courseId: string, lessonIds: string[]) {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-reorder-lessons", courseId, lessonIds },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async listLessonQuestions(lessonId: string) {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-lesson-questions", lessonId },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async linkQuestionToLesson(lessonId: string, questionRef: string) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-link-question-to-lesson", lessonId, questionRef },
      })
      if (error) throw error
      return data?.row
    },

    async unlinkQuestionFromLesson(lessonQuestionId: string) {
      const { data, error } = await invokeAdmin<{ success: boolean }>({
        method: "POST",
        body: { action: "admin-unlink-question-from-lesson", lessonQuestionId },
      })
      if (error) throw error
      return data?.success ?? false
    },

    async createYouTryQuestion(payload: Record<string, unknown>) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-create-you-try-question", ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async updateYouTryQuestion(questionId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-update-you-try-question", questionId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listYouTryQuestions() {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-you-try-questions" },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async getYouTryQuestion(questionId: string) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-get-you-try-question", questionId },
      })
      if (error) throw error
      return data?.row
    },

    async getPlatformConfig() {
      const { data, error } = await invokeAdmin<{ row: Record<string, unknown> | null }>({
        method: "POST",
        body: { action: "admin-get-platform-config" },
      })
      if (error) throw error
      return data?.row ?? null
    },

    async upsertPlatformConfig(payload: Record<string, unknown>) {
      const { data, error } = await invokeAdmin<{ row: Record<string, unknown> }>({
        method: "POST",
        body: { action: "admin-upsert-platform-config", data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listScoreTables() {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-score-tables" },
      })
      if (error) throw error
      return data?.rows ?? []
    },

    async getScoreTable(scoreTableId: string) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-get-score-table", scoreTableId },
      })
      if (error) throw error
      return data?.row
    },

    async updateScoreRow(scoreRowId: string, payload: Record<string, unknown>) {
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-update-score-row", scoreRowId, data: payload },
      })
      if (error) throw error
      return data?.row
    },

    async listUsers(limit = 100) {
      const { data, error } = await invokeAdmin<{ rows: unknown[] }>({
        method: "POST",
        body: { action: "admin-list-users", limit },
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
      const { data, error } = await invokeAdmin<{ row: unknown }>({
        method: "POST",
        body: { action: "admin-create-user", ...payload },
      })
      if (error) throw error
      return data?.row
    },

    async getUserDetail(userId: string) {
      const { data, error } = await invokeAdmin<{ profile: unknown; tests: unknown[] }>({
        method: "POST",
        body: { action: "admin-get-user-detail", userId },
      })
      if (error) throw error
      if (!data) throw new Error("No user detail returned")
      return data
    },
  }
}
