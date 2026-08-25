export const FREE_PREP_COURSE_SLUG = 'betterlsat-core-syllabus-structure-content'
export const FREE_PREP_COURSE_MODULE_TITLE = 'The Kickoff'

function normalizePrepCourseKey(value: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isFreePrepCourseSlug(courseSlug: string): boolean {
  return normalizePrepCourseKey(courseSlug) === FREE_PREP_COURSE_SLUG
}

/** LSAT Essential Course module 1 — the only free-plan unlock. */
export function isFreePrepCourseModule(input: {
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

export function canAccessPrepCourseModule(input: {
  hasActiveCore: boolean
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
}): boolean {
  if (input.hasActiveCore) return true
  return isFreePrepCourseModule(input)
}

export function findCurriculumModuleForLessonSlug<
  T extends {
    title: string
    sort_order: number
    sections: Array<{ lessons: Array<{ slug: string }> }>
  },
>(curriculum: { modules: T[] }, lessonSlug: string): T | null {
  for (const mod of curriculum.modules) {
    for (const section of mod.sections) {
      if (section.lessons.some((lesson) => lesson.slug === lessonSlug)) return mod
    }
  }
  return null
}
