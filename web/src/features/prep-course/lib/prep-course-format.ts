import type {
  PrepCourseCurriculum,
  PrepCourseModule,
  PrepCourseSection,
  PrepLesson,
} from "@/lib/api/prep-course"

export function totalDurationMinutes(lessons: PrepLesson[]): number {
  return lessons.reduce((sum, lesson) => sum + (lesson.duration_minutes ?? 0), 0)
}

export function formatDurationLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min"
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`
  return `${hours} hr ${mins} min`
}

export function formatDurationShort(minutes: number | null | undefined): string {
  const m = minutes ?? 0
  return m === 1 ? "1 min" : `${m} mins`
}

export function formatCourseHoursLabel(totalMinutes: number): string {
  if (totalMinutes < 60) return `About ${totalMinutes} min of content`
  const hours = Math.ceil(totalMinutes / 60)
  return `About ${hours}+ hours of content`
}

const PT_QUESTION_REF = /PT\s*0*\d+\s*[.\s]*S\s*\d+\s*[.\s]*Q\s*\d+/i

export function isPrepTestQuestionReferenceText(text: string | null | undefined): boolean {
  if (!text?.trim()) return false
  return PT_QUESTION_REF.test(text)
}

export function isPrepCourseDrillLessonType(lessonType: PrepLesson["lesson_type"]): boolean {
  return lessonType === "active_drill" || lessonType === "adaptive_drill"
}

/** Subtitle under lesson title; omit for prep-course drills before completion. */
export function lessonMetaLine(
  lesson: PrepLesson,
  options?: { activeDrillAttempted?: boolean },
): string | null {
  if (isResolvedPrepCourseDrillLesson(lesson) && !options?.activeDrillAttempted) {
    return null
  }
  const duration = formatDurationShort(lesson.duration_minutes)
  if (isResolvedPrepCourseDrillLesson(lesson)) {
    return duration === "0 mins" ? null : duration
  }
  // Summary often duplicates lesson body HTML; show duration only under the title.
  return duration === "0 mins" ? null : duration
}

export function nextLessonSlug(lessons: PrepLesson[], currentSlug: string): string | null {
  const idx = lessons.findIndex((l) => l.slug === currentSlug)
  if (idx < 0) return lessons[0]?.slug ?? null
  return lessons[idx + 1]?.slug ?? null
}

export function prevLessonSlug(lessons: PrepLesson[], currentSlug: string): string | null {
  const idx = lessons.findIndex((l) => l.slug === currentSlug)
  if (idx <= 0) return null
  return lessons[idx - 1]?.slug ?? null
}

export function countCompletedLessons(lessons: PrepLesson[], completedSlugs: Set<string> | string[]): number {
  const completed = completedSlugs instanceof Set ? completedSlugs : new Set(completedSlugs)
  return lessons.filter((l) => completed.has(l.slug)).length
}

export function lessonProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  return Math.round((completedCount / totalCount) * 100)
}

/** Figma course modules sidebar — right-side status chip */
export function moduleStatusLabel(completedCount: number, lessonCount: number): string | null {
  if (lessonCount <= 0) return "Not Started"
  if (completedCount <= 0) return "Not Started"
  if (completedCount >= lessonCount) return null
  return "Applied"
}

export type PrepCourseCurriculumStats = {
  moduleCount: number
  sectionCount: number
  lessonCount: number
  totalMinutes: number
}

export function sectionLessonCount(section: PrepCourseSection): number {
  return section.lessons.length
}

export function moduleLessonCount(mod: PrepCourseModule): number {
  return mod.sections.reduce((sum, section) => sum + section.lessons.length, 0)
}

/** Hide the default "General" wrapper — show lessons directly under the module. */
export function shouldFlattenModuleSections(mod: PrepCourseModule): boolean {
  if (mod.sections.length !== 1) return false
  const section = mod.sections[0]
  return section.title === "General" || section.id === "fallback-section"
}

export function sectionDurationMinutes(section: PrepCourseSection): number {
  return totalDurationMinutes(section.lessons)
}

export function moduleDurationMinutes(mod: PrepCourseModule): number {
  return mod.sections.reduce((sum, section) => sum + sectionDurationMinutes(section), 0)
}

export function curriculumStats(curriculum: PrepCourseCurriculum): PrepCourseCurriculumStats {
  let sectionCount = 0
  let lessonCount = 0
  let totalMinutes = 0
  for (const mod of curriculum.modules) {
    sectionCount += mod.sections.length
    for (const section of mod.sections) {
      lessonCount += section.lessons.length
      totalMinutes += sectionDurationMinutes(section)
    }
  }
  return {
    moduleCount: curriculum.modules.length,
    sectionCount,
    lessonCount,
    totalMinutes,
  }
}

export function formatTotalHoursLabel(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (mins === 0) return hours === 1 ? "1 hr" : `${hours} hrs`
  return `${hours} hrs ${mins} min`
}

export function formatSectionTimeLabel(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min"
  return formatDurationLabel(totalMinutes)
}

export function incompleteDurationMinutes(
  lessons: PrepLesson[],
  completedSlugs: Set<string> | string[],
): number {
  const completed = completedSlugs instanceof Set ? completedSlugs : new Set(completedSlugs)
  return lessons
    .filter((lesson) => !completed.has(lesson.slug))
    .reduce((sum, lesson) => sum + (lesson.duration_minutes ?? 0), 0)
}

export function formatRemainingHoursLabel(remainingMinutes: number): string {
  if (remainingMinutes <= 0) return "About 0 min left"
  if (remainingMinutes < 60) return `About ${remainingMinutes} min left`
  const hours = Math.ceil(remainingMinutes / 60)
  return hours === 1 ? "About 1 hr left" : `About ${hours} hrs left`
}

export type LessonLocation = {
  moduleId: string
  sectionId: string
}

export function findLessonLocation(
  curriculum: PrepCourseCurriculum,
  lessonSlug: string,
): LessonLocation | null {
  for (const mod of curriculum.modules) {
    for (const section of mod.sections) {
      if (section.lessons.some((lesson) => lesson.slug === lessonSlug)) {
        return { moduleId: mod.id, sectionId: section.id }
      }
    }
  }
  return null
}

export function findLessonSectionContext(
  curriculum: PrepCourseCurriculum,
  lessonSlug: string,
): { module: PrepCourseModule; section: PrepCourseSection } | null {
  for (const mod of curriculum.modules) {
    for (const section of mod.sections) {
      if (section.lessons.some((lesson) => lesson.slug === lessonSlug)) {
        return { module: mod, section }
      }
    }
  }
  return null
}

/** Ensures a module/section tree exists when API returns flat lessons only. */
export function normalizeCurriculum(
  curriculum: PrepCourseCurriculum | undefined,
  lessons: PrepLesson[],
  courseId: string,
): PrepCourseCurriculum {
  if (curriculum && curriculum.modules.length > 0) return curriculum
  if (lessons.length === 0) return { modules: [] }

  const generalSection: PrepCourseSection = {
    id: "fallback-section",
    module_id: "fallback-module",
    title: "General",
    sort_order: 1,
    duration_minutes: null,
    lessons: [...lessons].sort((a, b) => a.sort_order - b.sort_order),
  }

  return {
    modules: [
      {
        id: "fallback-module",
        course_id: courseId,
        title: "Course content",
        sort_order: 1,
        duration_minutes: null,
        sections: [generalSection],
      },
    ],
  }
}

export const LESSON_TYPE_LABEL: Record<PrepLesson["lesson_type"], string> = {
  video: "Video",
  text: "Text",
  video_text: "Video + Text",
  active_drill: "Active Drill",
  adaptive_drill: "Adaptive Drill",
  rep_work: "Rep Work",
}

type DrillLessonType = "active_drill" | "adaptive_drill" | "rep_work"

export function isDrillLessonType(type: PrepLesson["lesson_type"]): type is DrillLessonType {
  return type === "active_drill" || type === "adaptive_drill" || type === "rep_work"
}

const LESSON_TITLE_PREFIXES: Array<{ pattern: RegExp; kind: DrillLessonType }> = [
  { pattern: /^Rep Work\b/i, kind: "rep_work" },
  { pattern: /^Active Drill\b/i, kind: "active_drill" },
  { pattern: /^Adaptive Drill\b/i, kind: "adaptive_drill" },
  { pattern: /^Full Drill\b/i, kind: "adaptive_drill" },
]

function parseLessonTitlePrefix(title: string): { cleanTitle: string; kind: DrillLessonType } | null {
  for (const entry of LESSON_TITLE_PREFIXES) {
    if (!entry.pattern.test(title)) continue
    const cleanTitle = title.replace(entry.pattern, "").replace(/^[\s:–—-]+/, "").trim()
    return {
      cleanTitle: cleanTitle || title.trim(),
      kind: entry.kind,
    }
  }
  return null
}

function parseDrillKindFromSlug(slug: string): DrillLessonType | null {
  const normalized = slug.trim().toLowerCase()
  if (normalized.startsWith("full-drill") || normalized.startsWith("adaptive-drill")) {
    return "adaptive_drill"
  }
  if (normalized.startsWith("active-drill")) return "active_drill"
  if (normalized.startsWith("rep-work")) return "rep_work"
  return null
}

function stripHtmlForDrillInference(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function inferDrillKindFromContent(lesson: PrepLesson): DrillLessonType | null {
  const haystack = [
    lesson.title,
    lesson.summary ?? "",
    stripHtmlForDrillInference(lesson.text_content ?? ""),
  ]
    .join("\n")
    .toLowerCase()

  if (/\bfull drill\b/.test(haystack) || /\badaptive drill\b/.test(haystack)) {
    return "adaptive_drill"
  }
  if (/\bactive drill\b/.test(haystack) || /\byou try\b/.test(haystack)) {
    return "active_drill"
  }
  if (/\brep work\b/.test(haystack) || /\breview work\b/.test(haystack)) {
    return "rep_work"
  }
  return null
}

function resolveDrillLessonType(lesson: PrepLesson): DrillLessonType | null {
  if (isDrillLessonType(lesson.lesson_type)) return lesson.lesson_type
  const fromTitle = parseLessonTitlePrefix(lesson.title)?.kind
  if (fromTitle) return fromTitle
  const fromSlug = parseDrillKindFromSlug(lesson.slug)
  if (fromSlug) return fromSlug
  return inferDrillKindFromContent(lesson)
}

export function isResolvedPrepCourseDrillLesson(lesson: PrepLesson): boolean {
  const kind = resolveDrillLessonType(lesson)
  return kind === "active_drill" || kind === "adaptive_drill"
}

export function isResolvedAdaptiveDrillLesson(lesson: PrepLesson): boolean {
  return resolveDrillLessonType(lesson) === "adaptive_drill"
}

export { resolveDrillLessonType }

export type LessonRowSubtitle = {
  label: string
  duration: string
  accentClass: string
}

export type LessonRowDisplay = {
  title: string
  iconType: PrepLesson["lesson_type"]
  subtitle: LessonRowSubtitle | null
}

export function resolveLessonRowDisplay(lesson: PrepLesson): LessonRowDisplay {
  const prefix = parseLessonTitlePrefix(lesson.title)
  const drillKind = resolveDrillLessonType(lesson)
  const title = drillKind && prefix ? prefix.cleanTitle : lesson.title
  const iconType = drillKind ?? lesson.lesson_type
  const subtitle = drillKind
    ? {
        label: LESSON_TYPE_LABEL[drillKind],
        duration: formatDurationShort(lesson.duration_minutes),
        accentClass: lessonTypeAccentClass(drillKind)!,
      }
    : null

  return { title, iconType, subtitle }
}

export function lessonTypeAccentClass(type: PrepLesson["lesson_type"]): string | null {
  if (type === "adaptive_drill") return "text-[#0bbcc9]"
  if (type === "active_drill") return "text-[#00bc54]"
  if (type === "rep_work") return "text-[#0d47a1]"
  return null
}

export function lessonRowSubtitle(lesson: PrepLesson): LessonRowSubtitle | null {
  return resolveLessonRowDisplay(lesson).subtitle
}

export function lessonTypeBadgeClass(
  type: PrepLesson["lesson_type"],
  variant: "default" | "onPrimary" = "default",
): string {
  if (variant === "onPrimary") {
    if (type === "adaptive_drill") return "bg-[#fff8e6] text-[#ae8b00]"
    if (type === "active_drill") return "bg-[#fff4e5] text-[#c45c00]"
    return "bg-white/90 text-[#0d47a1]"
  }
  if (type === "adaptive_drill") return "bg-[#fff8e6] text-[#ae8b00]"
  if (type === "active_drill") return "bg-[#fff4e5] text-[#c45c00]"
  return "bg-[#edf3ff] text-[#0d47a1]"
}
