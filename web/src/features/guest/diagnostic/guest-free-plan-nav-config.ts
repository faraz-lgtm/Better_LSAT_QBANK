import {
  STUDENT_DASHBOARD_HREF,
  STUDENT_DIAGNOSTIC_HREF,
} from "@/features/app-shell/student-nav-config"

const GUEST_FREE_PLAN_RESULTS_HREF = "/app/diagnostic/results"
const GUEST_FREE_PLAN_DASHBOARD_HREF = STUDENT_DASHBOARD_HREF
const GUEST_FREE_PLAN_PRICING_HREF = "/app/pricing"

/**
 * Free-plan students keep Main (Dashboard, Diagnostic, Diagnostic Results).
 * Academy, Prep, and Insights stay locked until payment.
 */
function isFreePlanLockedNavHref(href: string): boolean {
  const path = href.split("?")[0] ?? href
  if (path === STUDENT_DASHBOARD_HREF || path === `${STUDENT_DASHBOARD_HREF}/`) return false
  if (path === STUDENT_DIAGNOSTIC_HREF) return false
  if (path.startsWith("/app/diagnostic") || path.startsWith("/diagnostic")) return false
  return true
}

function isGuestFreePlanRoute(pathname: string): boolean {
  return pathname.startsWith("/app/diagnostic/results") || pathname.startsWith("/diagnostic/results")
}

export {
  GUEST_FREE_PLAN_DASHBOARD_HREF,
  GUEST_FREE_PLAN_PRICING_HREF,
  GUEST_FREE_PLAN_RESULTS_HREF,
  isFreePlanLockedNavHref,
  isGuestFreePlanRoute,
}
