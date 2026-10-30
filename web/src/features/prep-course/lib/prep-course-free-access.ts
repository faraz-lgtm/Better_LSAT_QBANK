import type { AccessState } from "@/lib/api/users"
import type { PrepCourseCurriculum, PrepCourseModule, PrepCourseSection, PrepLesson } from "@/lib/api/prep-course"

import { findLessonSectionContext } from "@/features/prep-course/lib/prep-course-format"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

const FREE_PREP_COURSE_MODULE_TITLE = "The Kickoff"
const FREE_PREP_COURSE_SECOND_MODULE_TITLE = "The Anatomy of an Argument"
/** Free plan unlocks modules 1–2 on the Essentials course. */
const FREE_PREP_COURSE_MAX_MODULE_SORT_ORDER = 2
/**
 * Anatomy is one flat General section in production. Free access ends at this lesson
 * (inclusive lock): Main Conclusion Questions / Full Drill and everything after.
 */
const FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG = "full-drill-main-conclusion-questions"
/** Fallback cutoff when the curriculum payload has not hydrated this lesson yet. */
const FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER = 9

function normalizePrepCourseKey(value: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function isFreePrepCourseSlug(courseSlug: string): boolean {
  return normalizePrepCourseKey(courseSlug) === PREP_COURSE_ESSENTIALS_SLUG
}

function isKickoffModule(input: { moduleTitle: string; moduleSortOrder?: number }): boolean {
  const moduleTitle = normalizePrepCourseKey(input.moduleTitle)
  return (
    moduleTitle === normalizePrepCourseKey(FREE_PREP_COURSE_MODULE_TITLE) ||
    input.moduleSortOrder === 1
  )
}

function isAnatomyModule(input: { moduleTitle: string; moduleSortOrder?: number }): boolean {
  const moduleTitle = normalizePrepCourseKey(input.moduleTitle)
  return (
    moduleTitle === normalizePrepCourseKey(FREE_PREP_COURSE_SECOND_MODULE_TITLE) ||
    input.moduleSortOrder === 2
  )
}

/** LSAT Essential Course modules 1–2 — free-plan unlocks. */
function isFreePrepCourseModule(input: {
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
}): boolean {
  if (!isFreePrepCourseSlug(input.courseSlug)) return false
  const title = normalizePrepCourseKey(input.moduleTitle)
  if (
    title === normalizePrepCourseKey(FREE_PREP_COURSE_MODULE_TITLE) ||
    title === normalizePrepCourseKey(FREE_PREP_COURSE_SECOND_MODULE_TITLE)
  ) {
    return true
  }
  return (
    typeof input.moduleSortOrder === "number" &&
    input.moduleSortOrder >= 1 &&
    input.moduleSortOrder <= FREE_PREP_COURSE_MAX_MODULE_SORT_ORDER
  )
}

/**
 * Free plan: Kickoff is fully open. Anatomy keeps section 1 notionally open for
 * outline UX, but individual lessons use {@link isFreePrepCourseLesson}.
 */
function isFreePrepCourseSection(input: {
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
  sectionSortOrder?: number
}): boolean {
  if (!isFreePrepCourseModule(input)) return false
  if (isKickoffModule(input)) return true
  return input.sectionSortOrder === 1
}

function isAnatomyFirstLockedLesson(input: {
  lessonSlug?: string
  lessonTitle?: string
}): boolean {
  const slug = (input.lessonSlug ?? "").trim().toLowerCase()
  if (slug === FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG) return true
  const title = normalizePrepCourseKey(input.lessonTitle ?? "")
  return title === "main conclusion questions" || title === "full drill: main conclusion questions"
}

function resolveAnatomyFirstLockedSortOrder(
  module: Pick<PrepCourseModule, "sections">,
): number {
  for (const section of module.sections) {
    for (const lesson of section.lessons) {
      if (
        isAnatomyFirstLockedLesson({
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
        })
      ) {
        return lesson.sort_order
      }
    }
  }
  return FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER
}

/**
 * Free plan lessons: all of Kickoff; Anatomy lessons before Main Conclusion Questions.
 */
function isFreePrepCourseLesson(input: {
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
  sectionSortOrder?: number
  lessonSlug: string
  lessonTitle?: string
  lessonSortOrder?: number
  anatomyFirstLockedSortOrder?: number
}): boolean {
  if (!isFreePrepCourseModule(input)) return false
  if (isKickoffModule(input)) return true
  if (!isAnatomyModule(input)) return false

  if (isAnatomyFirstLockedLesson(input)) return false

  const cutoff =
    typeof input.anatomyFirstLockedSortOrder === "number"
      ? input.anatomyFirstLockedSortOrder
      : FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER

  if (typeof input.lessonSortOrder === "number") {
    return input.lessonSortOrder < cutoff
  }

  return false
}

function shouldLimitFreePrepCourseAccess(input: {
  hasActiveCore?: boolean
  accessState?: AccessState | null
  hasGuestPremiumAccount?: boolean
}): boolean {
  if (input.hasGuestPremiumAccount) return false
  if (input.hasActiveCore) return false
  return input.accessState === "PAYMENT_REQUIRED"
}

function canAccessPrepCourseModule(input: {
  hasActiveCore: boolean
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
}): boolean {
  if (input.hasActiveCore) return true
  return isFreePrepCourseModule(input)
}

function isPrepCourseModuleLockedForFreePlan(
  courseSlug: string,
  module: Pick<PrepCourseModule, "title" | "sort_order">,
  limitFreeAccess: boolean,
): boolean {
  if (!limitFreeAccess) return false
  return !isFreePrepCourseModule({
    courseSlug,
    moduleTitle: module.title,
    moduleSortOrder: module.sort_order,
  })
}

function isPrepCourseSectionLockedForFreePlan(
  courseSlug: string,
  module: Pick<PrepCourseModule, "title" | "sort_order" | "sections">,
  section: Pick<PrepCourseSection, "sort_order" | "lessons">,
  limitFreeAccess: boolean,
): boolean {
  if (!limitFreeAccess) return false
  if (
    !isFreePrepCourseModule({
      courseSlug,
      moduleTitle: module.title,
      moduleSortOrder: module.sort_order,
    })
  ) {
    return true
  }
  if (isKickoffModule({ moduleTitle: module.title, moduleSortOrder: module.sort_order })) {
    return false
  }
  if (section.lessons.length > 0) {
    const cutoff = resolveAnatomyFirstLockedSortOrder(module)
    return section.lessons.every(
      (lesson) =>
        !isFreePrepCourseLesson({
          courseSlug,
          moduleTitle: module.title,
          moduleSortOrder: module.sort_order,
          sectionSortOrder: section.sort_order,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
          lessonSortOrder: lesson.sort_order,
          anatomyFirstLockedSortOrder: cutoff,
        }),
    )
  }
  return !isFreePrepCourseSection({
    courseSlug,
    moduleTitle: module.title,
    moduleSortOrder: module.sort_order,
    sectionSortOrder: section.sort_order,
  })
}

function isPrepCourseLessonLockedForFreePlan(
  curriculum: PrepCourseCurriculum,
  courseSlug: string,
  lessonSlug: string,
  limitFreeAccess: boolean,
): boolean {
  if (!limitFreeAccess) return false
  const ctx = findLessonSectionContext(curriculum, lessonSlug)
  if (!ctx) return true
  const lesson =
    ctx.section.lessons.find((row) => row.slug === lessonSlug) ??
    ({ slug: lessonSlug, title: "", sort_order: Number.POSITIVE_INFINITY } as Pick<
      PrepLesson,
      "slug" | "title" | "sort_order"
    >)
  const cutoff = resolveAnatomyFirstLockedSortOrder(ctx.module)
  return !isFreePrepCourseLesson({
    courseSlug,
    moduleTitle: ctx.module.title,
    moduleSortOrder: ctx.module.sort_order,
    sectionSortOrder: ctx.section.sort_order,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    lessonSortOrder: lesson.sort_order,
    anatomyFirstLockedSortOrder: cutoff,
  })
}

function collectLockedLessonSlugsForFreePlan(
  curriculum: PrepCourseCurriculum,
  courseSlug: string,
  limitFreeAccess: boolean,
): Set<string> {
  const locked = new Set<string>()
  if (!limitFreeAccess) return locked
  for (const module of curriculum.modules) {
    const cutoff = resolveAnatomyFirstLockedSortOrder(module)
    for (const section of module.sections) {
      for (const lesson of section.lessons) {
        if (
          !isFreePrepCourseLesson({
            courseSlug,
            moduleTitle: module.title,
            moduleSortOrder: module.sort_order,
            sectionSortOrder: section.sort_order,
            lessonSlug: lesson.slug,
            lessonTitle: lesson.title,
            lessonSortOrder: lesson.sort_order,
            anatomyFirstLockedSortOrder: cutoff,
          })
        ) {
          locked.add(lesson.slug)
        }
      }
    }
  }
  return locked
}

export {
  FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG,
  FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER,
  FREE_PREP_COURSE_MAX_MODULE_SORT_ORDER,
  FREE_PREP_COURSE_MODULE_TITLE,
  FREE_PREP_COURSE_SECOND_MODULE_TITLE,
  canAccessPrepCourseModule,
  collectLockedLessonSlugsForFreePlan,
  isFreePrepCourseLesson,
  isFreePrepCourseModule,
  isFreePrepCourseSection,
  isFreePrepCourseSlug,
  isPrepCourseLessonLockedForFreePlan,
  isPrepCourseModuleLockedForFreePlan,
  isPrepCourseSectionLockedForFreePlan,
  resolveAnatomyFirstLockedSortOrder,
  shouldLimitFreePrepCourseAccess,
}
