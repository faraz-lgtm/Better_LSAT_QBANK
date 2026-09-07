import { describe, expect, it } from "vitest"

import {
  getActiveSectionKey,
  getStudentPageTitle,
  isNavItemActive,
} from "@/features/app-shell/student-nav-config"

describe("student-nav-config", () => {
  it("titles the premium home page Dashboard", () => {
    expect(getStudentPageTitle("/app")).toBe("Dashboard")
  })

  it("maps practice routes to prep section", () => {
    expect(getActiveSectionKey("/app/practice/drills")).toBe("prep")
    expect(getStudentPageTitle("/app/practice/drills")).toBe("Drills")
  })

  it("titles Blind Review without a sidebar item", () => {
    expect(getStudentPageTitle("/app/practice/blind-review")).toBe("Blind Review")
  })

  it("maps academy explanations", () => {
    expect(getActiveSectionKey("/app/prep-course/foo")).toBe("academy")
    expect(getStudentPageTitle("/app/learn/explanations")).toBe("Explanations")
  })

  it("hides the prep course content page title", () => {
    expect(getStudentPageTitle("/app/prep-course/prep-course")).toBeNull()
  })

  it("maps analytics routes to insights section", () => {
    expect(getActiveSectionKey("/app/analytics/drills")).toBe("insights")
    expect(getStudentPageTitle("/app/analytics")).toBe("Overview")
    expect(getStudentPageTitle("/app/analytics/drills")).toBe("Drills")
  })

  it("matches analytics tab query params", () => {
    expect(isNavItemActive("/app/analytics", "/app/analytics?tab=priorities", "?tab=priorities")).toBe(true)
    expect(isNavItemActive("/app/analytics", "/app/analytics?tab=priorities", "")).toBe(false)
    expect(isNavItemActive("/app/analytics", "/app/analytics", "")).toBe(true)
  })

  it("hides drill config and results page titles", () => {
    expect(getStudentPageTitle("/app/practice/drills/lr/new")).toBeNull()
    expect(getStudentPageTitle("/app/practice/drills/rc/new")).toBeNull()
    expect(getStudentPageTitle("/app/practice/results/session-1")).toBeNull()
  })

  it("hides prep test hub title", () => {
    expect(getStudentPageTitle("/app/preptest/pt-900")).toBeNull()
    expect(getStudentPageTitle("/app/preptest")).toBe("PrepTest")
  })

  it("hides prep test results title", () => {
    expect(getStudentPageTitle("/app/analytics/preptests/results/abc123")).toBe(null)
  })

  it("titles diagnostic results history", () => {
    expect(getStudentPageTitle("/app/diagnostic/results/mini")).toBe("Mini Diagnostic History")
    expect(getStudentPageTitle("/app/diagnostic/results/full/attempt-1")).toBe("Diagnostic Results")
  })

  it("does not mark overview active on nested analytics routes", () => {
    const siblings = [
      "/app/analytics",
      "/app/analytics?tab=priorities",
      "/app/analytics/drills",
    ]
    expect(isNavItemActive("/app/analytics/drills", "/app/analytics", "", siblings)).toBe(false)
    expect(isNavItemActive("/app/analytics/drills", "/app/analytics/drills", "", siblings)).toBe(true)
  })
})
