export const FREE_PREP_COURSE_SLUG = 'betterlsat-core-syllabus-structure-content'
export const FREE_PREP_COURSE_MODULE_TITLE = 'The Kickoff'
export const FREE_PREP_COURSE_SECOND_MODULE_TITLE = 'The Anatomy of an Argument'
/** Free plan unlocks modules 1–2 on the Essentials course. */
export const FREE_PREP_COURSE_MAX_MODULE_SORT_ORDER = 2
/**
 * Anatomy is one flat General section in production. Free access ends at this lesson
 * (inclusive lock): Main Conclusion Questions / Full Drill and everything after.
 */
export const FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG = 'full-drill-main-conclusion-questions'
/** Fallback cutoff when the curriculum payload has not hydrated this lesson yet. */
export const FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER = 9

function normalizePrepCourseKey(value: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isFreePrepCourseSlug(courseSlug: string): boolean {
  return normalizePrepCourseKey(courseSlug) === FREE_PREP_COURSE_SLUG
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
export function isFreePrepCourseModule(input: {
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
    typeof input.moduleSortOrder === 'number' &&
    input.moduleSortOrder >= 1 &&
    input.moduleSortOrder <= FREE_PREP_COURSE_MAX_MODULE_SORT_ORDER
  )
}

/**
 * Free plan: Kickoff is fully open. Anatomy keeps section 1 notionally open for
 * outline UX, but individual lessons use {@link isFreePrepCourseLesson}.
 */
export function isFreePrepCourseSection(input: {
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
  sectionSortOrder?: number
}): boolean {
  if (!isFreePrepCourseModule(input)) return false
  if (isKickoffModule(input)) return true
  return input.sectionSortOrder === 1
}

export function isAnatomyFirstLockedLesson(input: {
  lessonSlug?: string
  lessonTitle?: string
}): boolean {
  const slug = (input.lessonSlug ?? '').trim().toLowerCase()
  if (slug === FREE_ANATOMY_FIRST_LOCKED_LESSON_SLUG) return true
  const title = normalizePrepCourseKey(input.lessonTitle ?? '')
  return title === 'main conclusion questions' || title === 'full drill: main conclusion questions'
}

export function resolveAnatomyFirstLockedSortOrder(
  module: {
    sections: Array<{
      lessons: Array<{ slug: string; title?: string | null; sort_order: number }>
    }>
  },
): number {
  for (const section of module.sections) {
    for (const lesson of section.lessons) {
      if (
        isAnatomyFirstLockedLesson({
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title ?? undefined,
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
export function isFreePrepCourseLesson(input: {
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
    typeof input.anatomyFirstLockedSortOrder === 'number'
      ? input.anatomyFirstLockedSortOrder
      : FREE_ANATOMY_FIRST_LOCKED_LESSON_SORT_ORDER

  if (typeof input.lessonSortOrder === 'number') {
    return input.lessonSortOrder < cutoff
  }

  // Fail closed when Anatomy lesson position is unknown.
  return false
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

export function canAccessPrepCourseSection(input: {
  hasActiveCore: boolean
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
  sectionSortOrder?: number
}): boolean {
  if (input.hasActiveCore) return true
  return isFreePrepCourseSection(input)
}

export function canAccessPrepCourseLesson(input: {
  hasActiveCore: boolean
  courseSlug: string
  moduleTitle: string
  moduleSortOrder?: number
  sectionSortOrder?: number
  lessonSlug: string
  lessonTitle?: string
  lessonSortOrder?: number
  anatomyFirstLockedSortOrder?: number
}): boolean {
  if (input.hasActiveCore) return true
  return isFreePrepCourseLesson(input)
}

export function findCurriculumModuleForLessonSlug<
  T extends {
    title: string
    sort_order: number
    sections: Array<{
      sort_order?: number
      lessons: Array<{ slug: string; title?: string | null; sort_order?: number }>
    }>
  },
>(curriculum: { modules: T[] }, lessonSlug: string): T | null {
  return findCurriculumLessonContext(curriculum, lessonSlug)?.module ?? null
}

export function findCurriculumLessonContext<
  TModule extends {
    title: string
    sort_order: number
    sections: TSection[]
  },
  TSection extends {
    sort_order?: number
    lessons: TLesson[]
  },
  TLesson extends {
    slug: string
    title?: string | null
    sort_order?: number
  },
>(
  curriculum: { modules: TModule[] },
  lessonSlug: string,
): { module: TModule; section: TSection; lesson: TLesson } | null {
  for (const mod of curriculum.modules) {
    for (const section of mod.sections) {
      const lesson = section.lessons.find((row) => row.slug === lessonSlug)
      if (lesson) {
        return { module: mod, section, lesson }
      }
    }
  }
  return null
}
