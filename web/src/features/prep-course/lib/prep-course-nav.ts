export type PrepCourseNavStatus = "available" | "coming_soon"

export type PrepCourseNavItem = {
  slug: string
  title: string
  status: PrepCourseNavStatus
}

/** Fixed Prep Course sidebar order. */
export const PREP_COURSE_NAV_ITEMS: readonly PrepCourseNavItem[] = [
  {
    slug: "betterlsat-core-syllabus-structure-content",
    title: "LSAT Essential Course",
    status: "available",
  },
  {
    slug: "lr-mastery-course",
    title: "LR Mastery Course",
    status: "coming_soon",
  },
  {
    slug: "rc-mastery",
    title: "RC Mastery",
    status: "coming_soon",
  },
] as const

export const PREP_COURSE_ESSENTIALS_SLUG = PREP_COURSE_NAV_ITEMS[0].slug

export function findPrepCourseNavItem(slug: string): PrepCourseNavItem | undefined {
  return PREP_COURSE_NAV_ITEMS.find((item) => item.slug === slug)
}

export function isPrepCourseComingSoonSlug(slug: string): boolean {
  return findPrepCourseNavItem(slug)?.status === "coming_soon"
}
