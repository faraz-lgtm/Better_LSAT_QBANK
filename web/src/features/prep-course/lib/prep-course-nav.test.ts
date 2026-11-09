import { describe, expect, it } from "vitest"

import {
  findPrepCourseNavItem,
  isPrepCourseComingSoonSlug,
  PREP_COURSE_NAV_ITEMS,
} from "./prep-course-nav"

describe("prep-course-nav", () => {
  it("lists only LSAT Essentials for now", () => {
    expect(PREP_COURSE_NAV_ITEMS.map((item) => item.title)).toEqual([
      "LSAT Essentials Course",
    ])
  })

  it("does not treat Essentials as coming soon", () => {
    expect(isPrepCourseComingSoonSlug("betterlsat-core-syllabus-structure-content")).toBe(false)
    expect(isPrepCourseComingSoonSlug("lr-mastery-course")).toBe(false)
    expect(isPrepCourseComingSoonSlug("rc-mastery")).toBe(false)
  })

  it("resolves nav items by slug", () => {
    expect(findPrepCourseNavItem("betterlsat-core-syllabus-structure-content")?.title).toBe(
      "LSAT Essentials Course",
    )
    expect(findPrepCourseNavItem("missing")).toBeUndefined()
  })
})
