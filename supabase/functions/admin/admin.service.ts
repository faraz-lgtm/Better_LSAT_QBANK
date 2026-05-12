import { browserFacingSupabaseApiBaseUrl } from "../_shared/browser-facing-supabase-url.ts"
import { QUESTION_EXPLANATION_VIDEOS_BUCKET } from "../_shared/question-explanation-videos.ts"
import { coercePrepLessonType, isPrepLessonType, type PrepLessonType } from "../_shared/prep-lesson-type.ts"
import type { AdminRepository } from "./admin.repository.ts"
import JSZip from "npm:jszip@3.10.1"
import { XMLParser } from "npm:fast-xml-parser@4.5.0"

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

const BULK_IMPORT_MAX_DOCX_BYTES = 15 * 1024 * 1024
const BULK_IMPORT_TOKEN_TTL_MS = 10 * 60 * 1000

type BulkImportNormalizedLesson = {
  lesson_slug: string
  lesson_title: string
  lesson_type: PrepLessonType
  sort_order: number
  summary: string | null
  duration_minutes: number | null
  video_url: string | null
  text_content: string
  lesson_is_published: boolean
}

type BulkImportPreviewLesson = BulkImportNormalizedLesson & {
  status: "insert" | "update" | "invalid"
  errors: string[]
}

type BulkImportTokenPayload = {
  userId: string
  course: {
    id: string | null
    slug: string
    title: string
    description: string | null
    is_published: boolean
  }
  rows: BulkImportNormalizedLesson[]
  expiresAt: number
}

const bulkImportTokenStore = new Map<string, BulkImportTokenPayload>()

function decodeBase64ToUint8Array(value: string): Uint8Array {
  const normalized = value.replace(/^data:.*;base64,/, "")
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function parseBooleanLike(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return ["true", "t", "1", "yes", "y"].includes(value.trim().toLowerCase())
  return false
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
  return normalized || "untitled"
}

function uniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let n = 2
  while (used.has(`${base}-${n}`)) n += 1
  const next = `${base}-${n}`
  used.add(next)
  return next
}

function inferLessonTypeFromText(title: string, bodyLines: string[]): PrepLessonType {
  const text = `${title}\n${bodyLines.slice(0, 25).join("\n")}`.toLowerCase()
  if (text.includes("adaptive drill")) return "adaptive_drill"
  if (text.includes("active drill") || text.includes("you try")) return "active_drill"
  if (text.includes("rep work") || text.includes("review work")) return "rep_work"
  return "video_text"
}

function parseDurationMinutes(title: string, bodyLines: string[]): number | null {
  const durationRegex = /\b(\d{1,3})\s*(?:min|mins|minute|minutes)\b/i
  const candidates = [title, ...bodyLines.slice(0, 15)]
  for (const text of candidates) {
    const m = text.match(durationRegex)
    if (!m) continue
    const value = Number(m[1])
    if (Number.isFinite(value) && value >= 0 && value <= 300) return value
  }
  return null
}

function htmlParagraphs(lines: string[]): string {
  const cooked = lines.map((line) => line.trim()).filter(Boolean)
  if (cooked.length === 0) return "<p>Imported lesson content.</p>"
  return cooked.map((line) => `<p>${line}</p>`).join("")
}

function extractWordParagraphsFromXml(xml: string): string[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
    trimValues: false,
  })
  const parsed = parser.parse(xml) as Record<string, unknown>
  const doc = parsed["w:document"] as Record<string, unknown> | undefined
  const body = doc?.["w:body"] as Record<string, unknown> | undefined
  const rawParagraphs = body?.["w:p"]
  const paragraphs = Array.isArray(rawParagraphs) ? rawParagraphs : rawParagraphs ? [rawParagraphs] : []

  const collectText = (node: unknown, out: string[]) => {
    if (node == null) return
    if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
      out.push(String(node))
      return
    }
    if (Array.isArray(node)) {
      node.forEach((entry) => collectText(entry, out))
      return
    }
    if (typeof node === "object") {
      const record = node as Record<string, unknown>
      const hashText = record["#text"]
      if (hashText !== undefined) collectText(hashText, out)
      const textNode = record["w:t"]
      if (textNode !== undefined) collectText(textNode, out)
      const children = record["w:r"]
      if (children !== undefined) collectText(children, out)
      return
    }
  }

  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const pieces: string[] = []
    collectText(paragraph, pieces)
    const line = normalizeWhitespace(pieces.join(""))
    if (line) lines.push(line)
  }
  return lines
}

type LessonDraft = {
  sourceHeading: string
  title: string
  bodyLines: string[]
  moduleLabel: string | null
}

async function convertDocxToRawRows(input: {
  bytes: Uint8Array
  fallbackCourseSlug: string
  fallbackCourseTitle: string
  fallbackCourseDescription: string | null
  fallbackCourseIsPublished: boolean
}): Promise<Array<Record<string, unknown>>> {
  const zip = await JSZip.loadAsync(input.bytes)
  const documentEntry = zip.file("word/document.xml")
  if (!documentEntry) throw new Error("DOCX missing word/document.xml")
  const xml = await documentEntry.async("string")
  const paragraphs = extractWordParagraphsFromXml(xml)

  const explicitCoursePattern = /^course\s*name\s*:\s*(.+)$/i
  let detectedCourseTitle: string | null = null
  for (const p of paragraphs) {
    const m = p.match(explicitCoursePattern)
    if (!m) continue
    const value = normalizeWhitespace(m[1] ?? "")
    if (value) {
      detectedCourseTitle = value
      break
    }
  }

  const modulePattern = /^module\s+(\d+)\b[:\-]?\s*(.*)$/i
  const lessonPatterns = [
    /^module\s+\d+\s*,\s*lesson\s+(\d+)\s*[:\-]\s*(.+)$/i,
    /^lesson\s+(\d+)\s*[:\-]\s*(.+)$/i,
    /^lesson\s+(\d+)\s+(.+)$/i,
  ]

  const drafts: LessonDraft[] = []
  let current: LessonDraft | null = null
  let currentModuleLabel: string | null = null

  for (const line of paragraphs) {
    const moduleMatch = line.match(modulePattern)
    if (moduleMatch) {
      const moduleNo = moduleMatch[1]
      const moduleTitle = normalizeWhitespace(moduleMatch[2] ?? "")
      currentModuleLabel = moduleTitle ? `Module ${moduleNo}: ${moduleTitle}` : `Module ${moduleNo}`
    }

    let lessonMatch: RegExpMatchArray | null = null
    for (const pattern of lessonPatterns) {
      lessonMatch = line.match(pattern)
      if (lessonMatch) break
    }
    if (lessonMatch) {
      if (current) drafts.push(current)
      current = {
        sourceHeading: line,
        title: normalizeWhitespace(lessonMatch[2] ?? ""),
        bodyLines: [],
        moduleLabel: currentModuleLabel,
      }
      continue
    }

    if (current) current.bodyLines.push(line)
  }
  if (current) drafts.push(current)
  if (drafts.length === 0) throw new Error("No lesson boundaries detected in DOCX.")

  const usedSlugs = new Set<string>()
  const rows: Array<Record<string, unknown>> = []
  drafts.forEach((draft, index) => {
    const lessonSlug = uniqueSlug(slugify(draft.title), usedSlugs)
    const summary = draft.bodyLines.find((line) => line.length >= 20) ?? "Imported from BetterLSAT syllabus DOCX."
    rows.push({
      course_slug: slugify(detectedCourseTitle ?? input.fallbackCourseTitle),
      course_title: detectedCourseTitle ?? input.fallbackCourseTitle,
      course_description: input.fallbackCourseDescription ?? "",
      course_is_published: input.fallbackCourseIsPublished,
      lesson_slug: lessonSlug,
      lesson_title: draft.title,
      lesson_type: inferLessonTypeFromText(draft.title, draft.bodyLines),
      sort_order: index + 1,
      summary,
      duration_minutes: parseDurationMinutes(draft.title, draft.bodyLines),
      video_url: "",
      text_content: htmlParagraphs(draft.bodyLines),
      lesson_is_published: true,
      source_heading: draft.sourceHeading,
      module_label: draft.moduleLabel ?? "",
    })
  })
  return rows
}

function pruneExpiredBulkTokens() {
  const now = Date.now()
  for (const [token, payload] of bulkImportTokenStore.entries()) {
    if (payload.expiresAt <= now) bulkImportTokenStore.delete(token)
  }
}

function normalizeDryRunRows(
  rawRows: Array<Record<string, unknown>>,
  existingBySlug: Map<string, { id: string }>,
): { previewRows: BulkImportPreviewLesson[]; validRows: BulkImportNormalizedLesson[]; invalidCount: number } {
  const slugSeen = new Set<string>()
  const sortSeen = new Set<number>()
  const previewRows: BulkImportPreviewLesson[] = []
  const validRows: BulkImportNormalizedLesson[] = []
  let invalidCount = 0

  for (const rawRow of rawRows) {
    const errors: string[] = []
    const lessonSlugRaw = typeof rawRow.lesson_slug === "string" ? rawRow.lesson_slug.trim() : ""
    const lessonTitleRaw = typeof rawRow.lesson_title === "string" ? rawRow.lesson_title.trim() : ""
    const lessonTypeRaw = typeof rawRow.lesson_type === "string" ? rawRow.lesson_type.trim() : ""
    const sortOrderRaw = parseNullableNumber(rawRow.sort_order)
    const summary = parseNullableString(rawRow.summary)
    const duration = parseNullableNumber(rawRow.duration_minutes)
    const videoUrl = parseNullableString(rawRow.video_url)
    const textContentRaw = typeof rawRow.text_content === "string" ? rawRow.text_content.trim() : ""
    const isPublished = parseBooleanLike(rawRow.lesson_is_published)

    if (!lessonSlugRaw) errors.push("lesson_slug is required")
    if (!lessonTitleRaw) errors.push("lesson_title is required")
    if (!isPrepLessonType(lessonTypeRaw)) errors.push("lesson_type is invalid")
    if (sortOrderRaw === null || !Number.isInteger(sortOrderRaw) || sortOrderRaw <= 0) {
      errors.push("sort_order must be an integer > 0")
    }
    if (!textContentRaw) errors.push("text_content must be non-empty")
    if (duration !== null && duration < 0) errors.push("duration_minutes must be >= 0")
    if (lessonSlugRaw && slugSeen.has(lessonSlugRaw)) errors.push("duplicate lesson_slug in upload")
    if (sortOrderRaw !== null && sortSeen.has(sortOrderRaw)) errors.push("duplicate sort_order in upload")

    if (lessonSlugRaw) slugSeen.add(lessonSlugRaw)
    if (sortOrderRaw !== null) sortSeen.add(sortOrderRaw)

    const status: "insert" | "update" | "invalid" =
      errors.length > 0 ? "invalid" : existingBySlug.has(lessonSlugRaw) ? "update" : "insert"

    const previewRow: BulkImportPreviewLesson = {
      lesson_slug: lessonSlugRaw,
      lesson_title: lessonTitleRaw,
      lesson_type: isPrepLessonType(lessonTypeRaw) ? lessonTypeRaw : "video_text",
      sort_order: sortOrderRaw ?? 0,
      summary,
      duration_minutes: duration,
      video_url: videoUrl,
      text_content: textContentRaw || "<p>Imported lesson content.</p>",
      lesson_is_published: isPublished,
      status,
      errors,
    }
    previewRows.push(previewRow)

    if (status === "invalid") {
      invalidCount += 1
      continue
    }
    validRows.push({
      lesson_slug: previewRow.lesson_slug,
      lesson_title: previewRow.lesson_title,
      lesson_type: previewRow.lesson_type,
      sort_order: previewRow.sort_order,
      summary: previewRow.summary,
      duration_minutes: previewRow.duration_minutes,
      video_url: previewRow.video_url,
      text_content: previewRow.text_content,
      lesson_is_published: previewRow.lesson_is_published,
    })
  }

  return { previewRows, validRows, invalidCount }
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

    async reserveLessonVideoUpload(userId: string, lessonId: string, fileExtension: string) {
      await requireAdmin(userId)
      const ext = fileExtension.replace(/^\./, "").trim().toLowerCase()
      const allowed = new Set(["webm", "mp4", "mov", "m4v", "mkv"])
      if (!allowed.has(ext)) {
        throw new Error("Invalid file extension; use webm, mp4, mov, m4v, or mkv")
      }
      const exists = await deps.repository.adminLessonExists(lessonId)
      if (!exists) throw new Error("Lesson not found")
      const path = `lessons/${lessonId}/${crypto.randomUUID()}.${ext}`
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

    async bulkImportDryRun(
      userId: string,
      input: { courseId?: string; fileName: string; fileBytesBase64: string },
    ) {
      await requireAdmin(userId)
      pruneExpiredBulkTokens()
      if (!input.fileName.toLowerCase().endsWith(".docx")) throw new Error("Only .docx files are supported")

      const bytes = decodeBase64ToUint8Array(input.fileBytesBase64)
      if (bytes.length === 0) throw new Error("Uploaded DOCX is empty")
      if (bytes.length > BULK_IMPORT_MAX_DOCX_BYTES) {
        throw new Error(`DOCX too large. Max size is ${Math.round(BULK_IMPORT_MAX_DOCX_BYTES / (1024 * 1024))} MB`)
      }

      const rawRows = await convertDocxToRawRows({
        bytes,
        fallbackCourseSlug: slugify(input.fileName.replace(/\.docx$/i, "")),
        fallbackCourseTitle: input.fileName.replace(/\.docx$/i, ""),
        fallbackCourseDescription: null,
        fallbackCourseIsPublished: false,
      })

      const firstRow = rawRows[0] ?? {}
      const uploadedCourseSlug = slugify(String(firstRow.course_slug ?? "imported-course"))
      const uploadedCourseTitle = String(firstRow.course_title ?? "Imported Course").trim() || "Imported Course"
      const uploadedCourseDescription = parseNullableString(firstRow.course_description)
      const uploadedCoursePublished = parseBooleanLike(firstRow.course_is_published)

      let course =
        input.courseId && input.courseId.trim().length > 0 ? await deps.repository.getCourseById(input.courseId) : null
      if (!course) {
        course = await deps.repository.getCourseBySlug(uploadedCourseSlug)
      }

      const existingLessons = course ? await deps.repository.listLessons(String(course.id)) : []
      const existingBySlug = new Map(
        existingLessons.map((lesson) => [String((lesson as { slug?: unknown }).slug ?? ""), { id: String((lesson as { id?: unknown }).id ?? "") }]),
      )

      const { previewRows, validRows, invalidCount } = normalizeDryRunRows(rawRows, existingBySlug)
      const insertCount = previewRows.filter((row) => row.status === "insert").length
      const updateCount = previewRows.filter((row) => row.status === "update").length

      const importToken = crypto.randomUUID()
      const resolvedCourse = {
        id: course ? String(course.id) : null,
        slug: course ? String(course.slug) : uploadedCourseSlug,
        title: course ? String(course.title) : uploadedCourseTitle,
        description: course ? (course.description ? String(course.description) : null) : uploadedCourseDescription,
        is_published: course ? Boolean(course.is_published) : uploadedCoursePublished,
      }
      bulkImportTokenStore.set(importToken, {
        userId,
        course: resolvedCourse,
        rows: validRows,
        expiresAt: Date.now() + BULK_IMPORT_TOKEN_TTL_MS,
      })

      return {
        course: resolvedCourse,
        importToken,
        expiresAt: new Date(Date.now() + BULK_IMPORT_TOKEN_TTL_MS).toISOString(),
        counts: {
          totalRows: previewRows.length,
          insertCount,
          updateCount,
          invalidCount,
          validCount: validRows.length,
        },
        rows: previewRows,
      }
    },

    async bulkImportCommit(userId: string, input: { courseId?: string; importToken: string }) {
      await requireAdmin(userId)
      pruneExpiredBulkTokens()
      const tokenPayload = bulkImportTokenStore.get(input.importToken)
      if (!tokenPayload) throw new Error("Dry-run token is invalid or expired. Run dry-run again.")
      if (tokenPayload.userId !== userId) throw new AuthorizationError("Import token belongs to a different user.")
      if (tokenPayload.expiresAt <= Date.now()) {
        bulkImportTokenStore.delete(input.importToken)
        throw new Error("Dry-run token expired. Run dry-run again.")
      }

      let resolvedCourseId = tokenPayload.course.id
      if (input.courseId && resolvedCourseId && input.courseId !== resolvedCourseId) {
        throw new Error("Import token does not match selected course.")
      }
      if (!resolvedCourseId && input.courseId) {
        resolvedCourseId = input.courseId
      }
      if (!resolvedCourseId) {
        const existingBySlug = await deps.repository.getCourseBySlug(tokenPayload.course.slug)
        if (existingBySlug) {
          resolvedCourseId = String(existingBySlug.id)
        } else {
          let nextSlug = tokenPayload.course.slug
          let suffix = 2
          while (await deps.repository.getCourseBySlug(nextSlug)) {
            nextSlug = `${tokenPayload.course.slug}-${suffix}`
            suffix += 1
          }
          const created = await deps.repository.createCourse({
            slug: nextSlug,
            title: tokenPayload.course.title,
            description: tokenPayload.course.description,
            isPublished: tokenPayload.course.is_published,
          })
          resolvedCourseId = String(created.id)
        }
      }

      const existing = await deps.repository.listLessons(resolvedCourseId)
      const existingSlugs = new Set(existing.map((row) => String((row as { slug?: unknown }).slug ?? "")))
      const insertCount = tokenPayload.rows.filter((row) => !existingSlugs.has(row.lesson_slug)).length
      const updateCount = tokenPayload.rows.length - insertCount

      const upserted = await deps.repository.bulkUpsertLessons(resolvedCourseId, tokenPayload.rows)
      bulkImportTokenStore.delete(input.importToken)
      const finalLessons = await deps.repository.listLessons(resolvedCourseId)

      return {
        success: true,
        courseId: resolvedCourseId,
        counts: {
          inserted: insertCount,
          updated: updateCount,
          upserted: upserted.length,
          finalLessonCount: finalLessons.length,
        },
      }
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
