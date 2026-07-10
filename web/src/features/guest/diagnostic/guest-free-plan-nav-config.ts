/** Figma `19512:24718` — free-plan sidebar navigation (locked modules). */

export type GuestFreePlanNavItem = {
  label: string
  href?: string
  locked?: boolean
}

export type GuestFreePlanNavSection = {
  key: string
  label: string
  items: GuestFreePlanNavItem[]
}

const GUEST_FREE_PLAN_RESULTS_HREF = "/app/diagnostic/results"

const GUEST_FREE_PLAN_NAV_SECTIONS: GuestFreePlanNavSection[] = [
  {
    key: "main",
    label: "Main",
    items: [{ label: "Dashboard", href: GUEST_FREE_PLAN_RESULTS_HREF }],
  },
  {
    key: "practice",
    label: "Practice",
    items: [
      { label: "Practice Exams", locked: true },
      { label: "Question Bank", locked: true },
    ],
  },
  {
    key: "drill",
    label: "Drill",
    items: [
      { label: "Drills", locked: true },
      { label: "Schedule", locked: true },
      { label: "Wrong Review", locked: true },
      { label: "Analytics", href: GUEST_FREE_PLAN_RESULTS_HREF },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    items: [
      { label: "Trend Line", locked: true },
      { label: "Skills", locked: true },
      { label: "Sections", locked: true },
      { label: "Question", locked: true },
    ],
  },
]

function isGuestFreePlanRoute(pathname: string): boolean {
  return pathname.startsWith("/app/diagnostic/results") || pathname.startsWith("/diagnostic/results")
}

function isGuestFreePlanAnalyticsActive(pathname: string): boolean {
  return isGuestFreePlanRoute(pathname)
}

function isGuestFreePlanDashboardActive(pathname: string): boolean {
  return pathname === "/app" || pathname === "/app/"
}

export {
  GUEST_FREE_PLAN_NAV_SECTIONS,
  GUEST_FREE_PLAN_RESULTS_HREF,
  isGuestFreePlanAnalyticsActive,
  isGuestFreePlanDashboardActive,
  isGuestFreePlanRoute,
}
