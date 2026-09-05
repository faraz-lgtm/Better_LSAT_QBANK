import { describe, expect, it } from "vitest"

import {
  getActiveSectionKey,
  getStudentBreadcrumbs,
  getStudentPageTitle,
  isNavItemActive,
} from "@/features/app-shell/student-nav-config"

describe("student-nav-config", () => {
  it("builds Main / Dashboard breadcrumbs for the premium home page", () => {
    expect(getStudentBreadcrumbs("/app")).toEqual([{ label: "Main" }, { label: "Dashboard" }])
    expect(getStudentBreadcrumbs("/app/")).toEqual([{ label: "Main" }, { label: "Dashboard" }])
    expect(getStudentPageTitle("/app")).toBe("Dashboard")
  })

  it("maps practice routes to prep section", () => {
    expect(getActiveSectionKey("/app/practice/drills")).toBe("prep")
    expect(getStudentBreadcrumbs("/app/practice/drills")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills")).toBe("Drills")
  })

  it("keeps Blind Review breadcrumbs without a sidebar item", () => {
    expect(getStudentBreadcrumbs("/app/practice/blind-review")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Blind Review" },
    ])
    expect(getStudentPageTitle("/app/practice/blind-review")).toBe("Blind Review")
    expect(getStudentBreadcrumbs("/app/practice/blind-review/pt-141")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Blind Review" },
    ])
  })

  it("maps academy explanations breadcrumbs", () => {
    expect(getActiveSectionKey("/app/prep-course/foo")).toBe("academy")
    expect(getStudentBreadcrumbs("/app/learn/explanations")).toEqual([
      { label: "Academy", href: "/app/prep-course" },
      { label: "Explanations" },
    ])
    expect(getStudentPageTitle("/app/learn/explanations")).toBe("Explanations")
  })

  it("builds prep course content breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/prep-course/prep-course")).toEqual([
      { label: "Academy", href: "/app/prep-course" },
      { label: "Prep Courses", href: "/app/prep-course" },
      { label: "Course Content" },
    ])
    expect(getStudentPageTitle("/app/prep-course/prep-course")).toBeNull()
  })

  it("maps analytics routes to insights section", () => {
    expect(getActiveSectionKey("/app/analytics/drills")).toBe("insights")
    expect(getStudentBreadcrumbs("/app/analytics")).toEqual([
      { label: "Insights", href: "/app/analytics" },
      { label: "Overview" },
    ])
    expect(getStudentBreadcrumbs("/app/analytics/drills")).toEqual([
      { label: "Insights", href: "/app/analytics" },
      { label: "Drills" },
    ])
  })

  it("matches analytics tab query params", () => {
    expect(isNavItemActive("/app/analytics", "/app/analytics?tab=priorities", "?tab=priorities")).toBe(true)
    expect(isNavItemActive("/app/analytics", "/app/analytics?tab=priorities", "")).toBe(false)
    expect(isNavItemActive("/app/analytics", "/app/analytics", "")).toBe(true)
  })

  it("builds LR drill config breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/practice/drills/lr/new")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Drills", href: "/app/practice/drills" },
      { label: "LR Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills/lr/new")).toBeNull()
  })

  it("builds RC drill config breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/practice/drills/rc/new")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Drills", href: "/app/practice/drills" },
      { label: "RC Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills/rc/new")).toBeNull()
  })

  it("builds drill results breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/practice/results/session-1")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Drills", href: "/app/practice/drills" },
      { label: "Drill results" },
    ])
    expect(getStudentPageTitle("/app/practice/results/session-1")).toBeNull()
  })

  it("builds section results breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/practice/results/session-1", "?source=section")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Sections", href: "/app/practice/sections" },
      { label: "Section result" },
    ])
    expect(
      getStudentBreadcrumbs("/app/practice/results/session-1", "?returnTo=/app/practice/sections"),
    ).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Sections", href: "/app/practice/sections" },
      { label: "Section result" },
    ])
  })

  it("hides prep test hub title and extra breadcrumb", () => {
    expect(getStudentBreadcrumbs("/app/preptest/pt-900")).toEqual([
      { label: "PrepTest", href: "/app/preptest" },
    ])
    expect(getStudentPageTitle("/app/preptest/pt-900")).toBeNull()
    expect(getStudentBreadcrumbs("/app/preptest")).toEqual([{ label: "PrepTest" }])
    expect(getStudentPageTitle("/app/preptest")).toBe("PrepTest")
  })

  it("builds prep test results breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/analytics/preptests/results/abc123")).toEqual([
      { label: "Insights", href: "/app/analytics" },
      { label: "PrepTest", href: "/app/analytics/preptests" },
      { label: "Results" },
    ])
    expect(getStudentPageTitle("/app/analytics/preptests/results/abc123")).toBe(null)
  })

  it("builds diagnostic results history breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/diagnostic/results/mini")).toEqual([
      { label: "Diagnostic Results", href: "/app/diagnostic/results/mini" },
      { label: "Mini" },
    ])
    expect(getStudentPageTitle("/app/diagnostic/results/mini")).toBe("Mini Diagnostic History")
    expect(getStudentBreadcrumbs("/app/diagnostic/results/full/attempt-1")).toEqual([
      { label: "Diagnostic Results", href: "/app/diagnostic/results/mini" },
      { label: "Full", href: "/app/diagnostic/results/full" },
      { label: "Results" },
    ])
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
