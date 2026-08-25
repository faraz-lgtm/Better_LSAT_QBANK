import type { AccessState } from "@/lib/api/users"
import type { PrepCourseCurriculum, PrepCourseModule } from "@/lib/api/prep-course"

import { findLessonSectionContext } from "@/features/prep-course/lib/prep-course-format"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

const FREE_PREP_COURSE_MODULE_TITLE = "The Kickoff"

function normalizePrepCourseKey(value: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function isFreePrepCourseSlug(courseSlug: string): boolean {
  return normalizePrepCourseKey(courseSlug) === PREP_COURSE_ESSENTIALS_SLUG
}

/** LSAT Essential Course module 1 — the only free-plan unlock. */
function isFreePrepCourseModule(input: {
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
}): boolean {
  if (!isFreePrepCourseSlug(input.courseSlug)) return false
  if (normalizePrepCourseKey(input.moduleTitle) === normalizePrepCourseKey(FREE_PREP_COURSE_MODULE_TITLE)) {
    return true
  }
  return input.moduleSortOrder === 1
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

function isPrepCourseLessonLockedForFreePlan(
  curriculum: PrepCourseCurriculum,
  courseSlug: string,
  lessonSlug: string,
  limitFreeAccess: boolean,
): boolean {
  if (!limitFreeAccess) return false
  const ctx = findLessonSectionContext(curriculum, lessonSlug)
  if (!ctx) return true
  return isPrepCourseModuleLockedForFreePlan(courseSlug, ctx.module, true)
}

export {
  FREE_PREP_COURSE_MODULE_TITLE,
  canAccessPrepCourseModule,
  isFreePrepCourseModule,
  isFreePrepCourseSlug,
  isPrepCourseLessonLockedForFreePlan,
  isPrepCourseModuleLockedForFreePlan,
  shouldLimitFreePrepCourseAccess,
}
