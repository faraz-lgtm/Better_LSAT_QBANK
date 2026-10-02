import { describe, expect, it } from "vitest"

import {
  findPrepCourseNavItem,
  isPrepCourseComingSoonSlug,
  PREP_COURSE_NAV_ITEMS,
} from "./prep-course-nav"

describe("prep-course-nav", () => {
  it("lists Essential, LR Mastery, then RC Mastery", () => {
    expect(PREP_COURSE_NAV_ITEMS.map((item) => item.title)).toEqual([
      "LSAT Essentials Course",
      "LR Mastery Course",
      "RC Mastery Course",
    ])
  })

  it("marks mastery courses as coming soon", () => {
    expect(isPrepCourseComingSoonSlug("lr-mastery-course")).toBe(true)
    expect(isPrepCourseComingSoonSlug("rc-mastery")).toBe(true)
    expect(isPrepCourseComingSoonSlug("betterlsat-core-syllabus-structure-content")).toBe(false)
  })

  it("resolves nav items by slug", () => {
    expect(findPrepCourseNavItem("rc-mastery")?.title).toBe("RC Mastery Course")
    expect(findPrepCourseNavItem("missing")).toBeUndefined()
  })
})
