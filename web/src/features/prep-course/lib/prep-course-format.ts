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
  if (isPrepCourseDrillLessonType(lesson.lesson_type) && !options?.activeDrillAttempted) {
    return null
  }
  const duration = formatDurationShort(lesson.duration_minutes)
  if (isPrepCourseDrillLessonType(lesson.lesson_type)) {
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
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`
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

export function isDrillLessonType(type: PrepLesson["lesson_type"]): boolean {
  return type === "active_drill" || type === "adaptive_drill" || type === "rep_work"
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
