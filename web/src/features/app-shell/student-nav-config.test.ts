import { describe, expect, it } from "vitest"

import {
  getActiveSectionKey,
  getStudentBreadcrumbs,
  getStudentPageTitle,
  isNavItemActive,
} from "@/features/app-shell/student-nav-config"

describe("student-nav-config", () => {
  it("maps practice routes to prep section", () => {
    expect(getActiveSectionKey("/app/practice/drills")).toBe("prep")
    expect(getStudentBreadcrumbs("/app/practice/drills")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Prep" },
      { label: "Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills")).toBe("Drills")
  })

  it("maps academy explanations with foundation trail", () => {
    expect(getActiveSectionKey("/app/prep-course/foo")).toBe("academy")
    expect(getStudentBreadcrumbs("/app/learn/explanations")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Academy" },
      { label: "Foundation" },
      { label: "Explanations" },
    ])
    expect(getStudentPageTitle("/app/learn/explanations")).toBe("Explanations")
  })

  it("builds prep course content breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/prep-course/prep-course")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Academy" },
      { label: "Prep Course", href: "/app/prep-course" },
      { label: "Course Content" },
    ])
    expect(getStudentPageTitle("/app/prep-course/prep-course")).toBeNull()
  })

  it("maps analytics routes to insights section", () => {
    expect(getActiveSectionKey("/app/analytics/drills")).toBe("insights")
    expect(getStudentBreadcrumbs("/app/analytics")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Insights" },
      { label: "Overview" },
    ])
    expect(getStudentBreadcrumbs("/app/analytics/drills")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Insights" },
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
      { label: "Main", href: "/app" },
      { label: "Prep" },
      { label: "LR Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills/lr/new")).toBeNull()
  })

  it("builds RC drill config breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/practice/drills/rc/new")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Prep" },
      { label: "RC Drills" },
    ])
    expect(getStudentPageTitle("/app/practice/drills/rc/new")).toBeNull()
  })

  it("hides prep test hub title and extra breadcrumb", () => {
    expect(getStudentBreadcrumbs("/app/practice/preptest/pt-900")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Prep" },
    ])
    expect(getStudentPageTitle("/app/practice/preptest/pt-900")).toBeNull()
    expect(getStudentBreadcrumbs("/app/practice/preptest")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Prep" },
      { label: "PrepTest" },
    ])
  })

  it("builds prep test results breadcrumbs", () => {
    expect(getStudentBreadcrumbs("/app/analytics/preptests/results/abc123")).toEqual([
      { label: "Main", href: "/app" },
      { label: "Insights" },
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
