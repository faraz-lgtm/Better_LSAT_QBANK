import { describe, expect, it } from "vitest"

import {
  getActiveSectionKey,
  getStudentBreadcrumbs,
  getStudentPageTitle,
  isNavItemActive,
} from "@/features/app-shell/student-nav-config"

import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"

describe("student-nav-config", () => {
  it("maps practice routes to prep section", () => {
    expect(getActiveSectionKey("/app/practice/drills")).toBe("prep")
    expect(getStudentBreadcrumbs("/app/practice/drills")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills")).toBe("Drills")
  })

  it("maps academy explanations with foundation trail", () => {
    expect(getActiveSectionKey("/app/prep-course/foo")).toBe("academy")
    expect(getStudentBreadcrumbs("/app/learn/explanations")).toEqual([
      { label: "Academy", href: "/app/prep-course" },
      { label: "Foundation" },
      { label: "Explanations" },
    ])
    expect(getStudentPageTitle("/app/learn/explanations")).toBe("Explanations")
  })

  it("builds prep course content breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/prep-course/prep-course")).toEqual([
      { label: "Academy", href: "/app/prep-course" },
      { label: "Prep Course", href: "/app/prep-course" },
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
      { label: "Foundations" },
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

  it("hides prep test hub title and extra breadcrumb", () => {
    expect(getStudentBreadcrumbs("/app/practice/preptest/pt-900")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
    ])
    expect(getStudentPageTitle("/app/practice/preptest/pt-900")).toBeNull()
    expect(getStudentBreadcrumbs("/app/practice/preptest")).toEqual([
      { label: "Prep", href: "/app/practice/drills" },
      { label: "PrepTest" },
    ])
    expect(getStudentPageTitle("/app/preptest/pt-900")).toBeNull()
    expect(getStudentBreadcrumbs("/app/preptest")).toEqual([{ label: "PrepTest" }])
  })

  it("builds prep test results breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/analytics/preptests/results/abc123")).toEqual([
      { label: "Insights", href: "/app/analytics" },
      { label: "Foundations" },
      { label: "PrepTest", href: "/app/analytics/preptests" },
      { label: "Results" },
    ])
    expect(getStudentPageTitle("/app/analytics/preptests/results/abc123")).toBe(null)
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
