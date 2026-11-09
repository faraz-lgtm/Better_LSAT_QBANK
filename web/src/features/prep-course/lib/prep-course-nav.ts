export type PrepCourseNavStatus = "available" | "coming_soon"

export type PrepCourseNavItem = {
  slug: string
  title: string
  status: PrepCourseNavStatus
}

/** Fixed Prep Course sidebar order. Mastery courses can be re-added when ready. */
export const PREP_COURSE_NAV_ITEMS: readonly PrepCourseNavItem[] = [
  {
    slug: "betterlsat-core-syllabus-structure-content",
    title: "LSAT Essentials Course",
    status: "available",
  },
] as const

export const PREP_COURSE_ESSENTIALS_SLUG = PREP_COURSE_NAV_ITEMS[0].slug

export function findPrepCourseNavItem(slug: string): PrepCourseNavItem | undefined {
  return PREP_COURSE_NAV_ITEMS.find((item) => item.slug === slug)
}

export function isPrepCourseComingSoonSlug(slug: string): boolean {
  return findPrepCourseNavItem(slug)?.status === "coming_soon"
}
