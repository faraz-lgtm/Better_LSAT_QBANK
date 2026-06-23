export type StudentNavSectionKey = "academy" | "prep" | "insights"

export type StudentNavItem = {
  label: string
  href: string
}

export type StudentNavSection = {
  key: StudentNavSectionKey
  label: string
  items: StudentNavItem[]
}

export const STUDENT_DASHBOARD_HREF = "/app"

export const STUDENT_NAV_SECTIONS: StudentNavSection[] = [
  {
    key: "academy",
    label: "Academy",
    items: [
      { label: "Prep Course", href: "/app/prep-course" },
      { label: "Explanations", href: "/app/learn/explanations" },
    ],
  },
  {
    key: "prep",
    label: "Prep",
    items: [
      { label: "Drills", href: "/app/practice/drills" },
      { label: "Sections", href: "/app/practice/sections" },
      { label: "PrepTest", href: "/app/practice/preptest" },
      { label: "Blind Review", href: "/app/practice/blind-review" },
    ],
  },
  {
    key: "insights",
    label: "Insights",
    items: [
      { label: "Overview", href: "/app/analytics" },
      // { label: "Priorities", href: "/app/analytics?tab=priorities" },
      // { label: "Practice history", href: "/app/analytics?tab=history" },
      { label: "Drills", href: "/app/analytics/drills" },
      { label: "Sections", href: "/app/analytics/sections" },
      { label: "PrepTest", href: "/app/analytics/preptests" },
    ],
  },
]

export const STUDENT_APP_VERSION = "1.0.3"

export function isDashboardActive(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/"
}

export function getActiveSectionKey(pathname: string): StudentNavSectionKey | null {
  if (pathname.startsWith("/app/prep-course") || pathname.startsWith("/app/learn")) return "academy"
  if (pathname.startsWith("/app/practice")) return "prep"
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

function isPracticePrepTestHub(pathname: string): boolean {
  return /^\/app\/practice\/preptest\/[^/]+$/.test(pathname)
}

export function getStudentBreadcrumbs(pathname: string, search = ""): StudentBreadcrumb[] {
  if (isDashboardActive(pathname)) {
    return [{ label: "Dashboard" }]
  }

  const crumbs: StudentBreadcrumb[] = []
  const section = getActiveSection(pathname)
  if (!section) return crumbs

  crumbs.push({ label: section.label })

  if (isPracticePrepTestHub(pathname)) {
    return crumbs
  }

  if (pathname.startsWith("/app/analytics/preptests/results/")) {
    crumbs.push({ label: "Foundations" })
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
    crumbs.push({ label: "LR Drills" })
    return crumbs
  }

  if (pathname === "/app/practice/drills/rc/new") {
    crumbs.push({ label: "RC Drills" })
    return crumbs
  }

  if (pathname.startsWith("/app/prep-course/") && pathname !== "/app/prep-course") {
    crumbs.push({ label: "Prep Course", href: "/app/prep-course" })
    crumbs.push({ label: "Course Content" })
    return crumbs
  }

  const activeItem = findActiveNavItem(pathname, search)
  const isInsightsSubPage =
    section.key === "insights" && pathname !== "/app/analytics" && !pathname.match(/^\/app\/analytics\/?$/)

  if (isInsightsSubPage) {
    crumbs.push({ label: "Foundations" })
  }

  if (activeItem && !crumbs.some((crumb) => crumb.label === activeItem.label)) {
    crumbs.push({ label: activeItem.label })
  }

  return crumbs
}

export function getStudentPageTitle(pathname: string, search = ""): string | null {
  if (isDashboardActive(pathname)) return "Dashboard"
  if (isPracticePrepTestHub(pathname)) return null
  if (pathname.startsWith("/app/prep-course/") && pathname !== "/app/prep-course") return null
  if (pathname.startsWith("/app/prep-course")) return "Prep Course"
  if (pathname.startsWith("/app/learn")) return "Explanations"
  if (pathname.startsWith("/app/analytics/preptests/results/")) return null
  if (pathname === "/app/practice/drills/lr/new" || pathname === "/app/practice/drills/rc/new") return null

  const activeItem = findActiveNavItem(pathname, search)
  if (activeItem) return activeItem.label

  const section = getActiveSection(pathname)
  return section?.label ?? null
}
