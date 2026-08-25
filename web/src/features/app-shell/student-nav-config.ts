import { PREPTEST_LIST_HREF, isPrepTestHubDetailPath, isPrepTestStudentPath } from "@/features/student/preptests/preptest-routes"
import {
  DIAGNOSTIC_RESULTS_FULL_HREF,
  DIAGNOSTIC_RESULTS_MINI_HREF,
  diagnosticHistoryHref,
  diagnosticResultsSectionFromPath,
} from "@/features/student/diagnostic/diagnostic-results-routes"

export type StudentNavSectionKey = "academy" | "prep" | "insights"

/** Per-item icons from Figma sidebar node `19640:23125`. */
export type StudentNavItemIconKey =
  | "dashboard"
  | "diagnostic"
  | "prep-course"
  | "explanations"
  | "drills"
  | "sections"
  | "preptest"
  | "blind-review"
  | "overview"
  | "insights-drills"
  | "insights-sections"
  | "insights-preptest"

export const STUDENT_NAV_ITEM_ICON_SRC: Record<StudentNavItemIconKey, string> = {
  dashboard: "/nav/dashboard.svg",
  diagnostic: "/nav/test.svg",
  "prep-course": "/nav/prep-course.svg",
  explanations: "/nav/explanations.svg",
  drills: "/nav/drills.svg",
  sections: "/nav/sections.svg",
  preptest: "/nav/preptest.svg",
  "blind-review": "/nav/blind-review.svg",
  overview: "/nav/overview.svg",
  "insights-drills": "/nav/insights-drills.svg",
  "insights-sections": "/nav/insights-sections.svg",
  "insights-preptest": "/nav/insights-preptest.svg",
}

export const STUDENT_NAV_LOGOUT_ICON_SRC = "/nav/logout.svg"

export type StudentNavItem = {
  label: string
  href: string
  icon: StudentNavItemIconKey
}

export type StudentNavSection = {
  key: StudentNavSectionKey
  label: string
  items: StudentNavItem[]
}

export const STUDENT_MAIN_NAV_SECTION = {
  label: "MAIN",
}

export const STUDENT_DASHBOARD_HREF = "/app"

export const STUDENT_DASHBOARD_ICON: StudentNavItemIconKey = "dashboard"

export const STUDENT_DIAGNOSTIC_HREF = "/intent"

export const STUDENT_DIAGNOSTIC_ICON: StudentNavItemIconKey = "diagnostic"

export const STUDENT_NAV_SECTIONS: StudentNavSection[] = [
  {
    key: "academy",
    label: "ACADEMY",
    items: [
      { label: "Prep Course", href: "/app/prep-course", icon: "prep-course" },
      { label: "Explanations", href: "/app/learn/explanations", icon: "explanations" },
    ],
  },
  {
    key: "prep",
    label: "PREP",
    items: [
      { label: "Drills", href: "/app/practice/drills", icon: "drills" },
      { label: "Sections", href: "/app/practice/sections", icon: "sections" },
      { label: "PrepTest", href: PREPTEST_LIST_HREF, icon: "preptest" },
      { label: "Blind Review", href: "/app/practice/blind-review", icon: "blind-review" },
    ],
  },
  {
    key: "insights",
    label: "INSIGHTS",
    items: [
      { label: "Overview", href: "/app/analytics", icon: "overview" },
      { label: "Drills", href: "/app/analytics/drills", icon: "insights-drills" },
      { label: "Sections", href: "/app/analytics/sections", icon: "insights-sections" },
      { label: "PrepTest", href: "/app/analytics/preptests", icon: "insights-preptest" },
    ],
  },
]

export const STUDENT_APP_VERSION = "1.0.3"

export function isDashboardActive(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/"
}

export function getActiveSectionKey(pathname: string): StudentNavSectionKey | null {
  if (pathname.startsWith("/app/prep-course") || pathname.startsWith("/app/learn")) return "academy"
  if (pathname.startsWith("/app/practice") || isPrepTestStudentPath(pathname)) return "prep"
  if (pathname.startsWith("/app/analytics")) return "insights"
  return null
}

export function getActiveSection(pathname: string): StudentNavSection | null {
  const key = getActiveSectionKey(pathname)
  if (!key) return null
  return STUDENT_NAV_SECTIONS.find((section) => section.key === key) ?? null
}

export function findActiveNavItem(pathname: string, search = ""): StudentNavItem | null {
  for (const section of STUDENT_NAV_SECTIONS) {
    const siblingHrefs = section.items.map((item) => item.href)
    for (const item of section.items) {
      if (isNavItemActive(pathname, item.href, search, siblingHrefs)) {
        return item
      }
    }
  }
  return null
}

export function isNavItemActive(
  pathname: string,
  href: string,
  search = "",
  siblingHrefs: string[] = [],
): boolean {
  const [path, query] = href.split("?")
  if (query) {
    const params = new URLSearchParams(query)
    const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    if (pathname !== path) return false
    for (const [key, value] of params.entries()) {
      if (current.get(key) !== value) return false
    }
    return true
  }
  if (pathname === path) return true
  if (path === PREPTEST_LIST_HREF && isPrepTestStudentPath(pathname)) return true
  const hasChildNavItem = siblingHrefs.some((sibling) => {
    const [siblingPath] = sibling.split("?")
    return siblingPath !== path && siblingPath.startsWith(`${path}/`)
  })
  if (hasChildNavItem) return false
  return pathname.startsWith(`${path}/`)
}

export type StudentBreadcrumb = {
  label: string
  href?: string
}

function getSectionLandingHref(key: StudentNavSectionKey): string | undefined {
  if (key === "prep") return "/app/practice/drills"
  if (key === "academy") return "/app/prep-course"
  if (key === "insights") return "/app/analytics"
  return undefined
}

function sectionBreadcrumbLabel(label: string): string {
  return label.charAt(0) + label.slice(1).toLowerCase()
}

function isPracticeSectionResultsSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  if (params.get("source") === "section") return true
  const returnTo = params.get("returnTo") ?? ""
  return returnTo.includes("/practice/sections")
}

export function getStudentBreadcrumbs(pathname: string, search = ""): StudentBreadcrumb[] {
  if (pathname.startsWith("/app/diagnostic/results")) {
    const resultsSection = diagnosticResultsSectionFromPath(pathname)
    const crumbs: StudentBreadcrumb[] = [
      { label: "Diagnostic Results", href: DIAGNOSTIC_RESULTS_MINI_HREF },
    ]
    if (resultsSection) {
      const historyHref = diagnosticHistoryHref(resultsSection)
      const isAttempt = pathname !== DIAGNOSTIC_RESULTS_MINI_HREF && pathname !== DIAGNOSTIC_RESULTS_FULL_HREF
      crumbs.push({
        label: resultsSection === "mini" ? "Mini" : "Full",
        href: isAttempt ? historyHref : undefined,
      })
      if (isAttempt) crumbs.push({ label: "Results" })
    }
    return crumbs
  }

  if (isDashboardActive(pathname)) {
    return [{ label: "Dashboard" }]
  }

  if (pathname === "/app/account") {
    return [{ label: "Account" }]
  }

  if (pathname === PREPTEST_LIST_HREF) {
    return [{ label: "PrepTest" }]
  }

  if (isPrepTestHubDetailPath(pathname)) {
    return [{ label: "PrepTest", href: PREPTEST_LIST_HREF }]
  }

  const section = getActiveSection(pathname)
  if (!section) return []

  const crumbs: StudentBreadcrumb[] = [
    { label: sectionBreadcrumbLabel(section.label), href: getSectionLandingHref(section.key) },
  ]

  if (pathname.startsWith("/app/analytics/preptests/results/")) {
    crumbs.push({ label: "PrepTest", href: "/app/analytics/preptests" })
    crumbs.push({ label: "Results" })
    return crumbs
  }

  if (pathname.startsWith("/app/learn/explanations")) {
    crumbs.push({ label: "Foundation" })
    crumbs.push({ label: "Explanations" })
    return crumbs
  }

  if (pathname === "/app/practice/drills/lr/new") {
    crumbs.push({ label: "Drills", href: "/app/practice/drills" })
    crumbs.push({ label: "LR Drills" })
    return crumbs
  }

  if (pathname === "/app/practice/drills/rc/new") {
    crumbs.push({ label: "Drills", href: "/app/practice/drills" })
    crumbs.push({ label: "RC Drills" })
    return crumbs
  }

  if (pathname.startsWith("/app/practice/results/")) {
    if (isPracticeSectionResultsSearch(search)) {
      crumbs.push({ label: "Sections", href: "/app/practice/sections" })
      crumbs.push({ label: "Section result" })
      return crumbs
    }
    crumbs.push({ label: "Drills", href: "/app/practice/drills" })
    crumbs.push({ label: "Drill results" })
    return crumbs
  }

  if (pathname.startsWith("/app/prep-course/") && pathname !== "/app/prep-course") {
    crumbs.push({ label: "Prep Course", href: "/app/prep-course" })
    crumbs.push({ label: "Course Content" })
    return crumbs
  }

  const activeItem = findActiveNavItem(pathname, search)

  if (activeItem && !crumbs.some((crumb) => crumb.label === activeItem.label)) {
    crumbs.push({ label: activeItem.label })
  }

  return crumbs
}

export function getStudentPageTitle(pathname: string, search = ""): string | null {
  if (isDashboardActive(pathname)) return "Dashboard"
  if (pathname === DIAGNOSTIC_RESULTS_MINI_HREF) return "Mini Diagnostic History"
  if (pathname === DIAGNOSTIC_RESULTS_FULL_HREF) return "Full Diagnostic History"
  if (pathname.startsWith("/app/diagnostic/results/")) return "Diagnostic Results"
  if (pathname === "/app/account") return "Account"
  if (isPrepTestHubDetailPath(pathname)) return null
  if (pathname.startsWith("/app/prep-course/") && pathname !== "/app/prep-course") return null
  if (pathname.startsWith("/app/prep-course")) return "Prep Course"
  if (pathname.startsWith("/app/learn")) return "Explanations"
  if (pathname.startsWith("/app/analytics/preptests/results/")) return null
  if (pathname === "/app/practice/drills/lr/new" || pathname === "/app/practice/drills/rc/new") return null
  if (pathname.startsWith("/app/practice/results/")) return null

  const activeItem = findActiveNavItem(pathname, search)
  if (activeItem) return activeItem.label

  const section = getActiveSection(pathname)
  return section ? sectionBreadcrumbLabel(section.label) : null
}
