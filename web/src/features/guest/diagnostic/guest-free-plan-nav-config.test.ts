import { describe, expect, it } from "vitest"

import { isFreePlanLockedNavHref } from "./guest-free-plan-nav-config"

describe("isFreePlanLockedNavHref", () => {
  it("keeps Dashboard, Diagnostic Test, Diagnostic Results, and Diagnostic Explanation unlocked", () => {
    expect(isFreePlanLockedNavHref("/app")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/")).toBe(false)
    expect(isFreePlanLockedNavHref("/intent")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results/mini")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/results/full")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/diagnostic/explanations")).toBe(false)
  })

  it("keeps limited Prep Course (LSAT Essentials Course) unlocked", () => {
    expect(isFreePlanLockedNavHref("/app/prep-course")).toBe(false)
    expect(
      isFreePlanLockedNavHref("/app/prep-course/betterlsat-core-syllabus-structure-content"),
    ).toBe(false)
    expect(
      isFreePlanLockedNavHref(
        "/app/prep-course/betterlsat-core-syllabus-structure-content/welcome-to-the-arena",
      ),
    ).toBe(false)
  })

  it("keeps tutoring and community destinations unlocked", () => {
    expect(isFreePlanLockedNavHref("/app/tutoring/sessions")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/tutoring/live-classes")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/feedback")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/roadmap")).toBe(false)
  })

  it("keeps PrepTest list unlocked for free browsing", () => {
    expect(isFreePlanLockedNavHref("/app/preptest")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/preptest/pt-121")).toBe(false)
  })

  it("keeps Academy Explanations unlocked for free browsing", () => {
    expect(isFreePlanLockedNavHref("/app/learn/explanations")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/learn/explanations/q/pt159-s1-q1")).toBe(false)
  })

  it("keeps Prep Drills unlocked for free browsing", () => {
    expect(isFreePlanLockedNavHref("/app/practice/drills")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/practice/drills/lr/new")).toBe(false)
  })

  it("keeps Sections unlocked for free browsing", () => {
    expect(isFreePlanLockedNavHref("/app/practice/sections")).toBe(false)
    expect(isFreePlanLockedNavHref("/app/practice/sections/session/abc")).toBe(false)
  })

  it("locks other Academy, Prep, and Insights destinations", () => {
    expect(isFreePlanLockedNavHref("/app/prep-course/lr-mastery-course")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/prep-course/rc-mastery")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/practice/blind-review")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/drills")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/sections")).toBe(true)
    expect(isFreePlanLockedNavHref("/app/analytics/preptests")).toBe(true)
  })
})
