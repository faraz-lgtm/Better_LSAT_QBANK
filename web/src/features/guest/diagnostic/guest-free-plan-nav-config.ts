import {
  STUDENT_DASHBOARD_HREF,
  STUDENT_DIAGNOSTIC_HREF,
} from "@/features/app-shell/student-nav-config"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

const GUEST_FREE_PLAN_RESULTS_HREF = "/app/diagnostic/results"
const GUEST_FREE_PLAN_DASHBOARD_HREF = STUDENT_DASHBOARD_HREF
const GUEST_FREE_PLAN_PRICING_HREF = "/app/pricing"
const GUEST_FREE_PLAN_PREP_COURSE_HREF = "/app/prep-course"
const GUEST_FREE_PLAN_ESSENTIALS_HREF = `${GUEST_FREE_PLAN_PREP_COURSE_HREF}/${PREP_COURSE_ESSENTIALS_SLUG}`

/**
 * Free-plan students keep Main (Dashboard, Diagnostic, Diagnostic Results)
 * and limited Prep Course (LSAT Essential Course / The Kickoff).
 * Other Academy, Prep, and Insights destinations stay locked until payment.
 */
function isFreePlanLockedNavHref(href: string): boolean {
  const path = href.split("?")[0] ?? href
  if (path === STUDENT_DASHBOARD_HREF || path === `${STUDENT_DASHBOARD_HREF}/`) return false
  if (path === STUDENT_DIAGNOSTIC_HREF) return false
  if (path.startsWith("/app/diagnostic") || path.startsWith("/diagnostic")) return false
  if (path === GUEST_FREE_PLAN_PREP_COURSE_HREF || path === `${GUEST_FREE_PLAN_PREP_COURSE_HREF}/`) {
    return false
  }
  if (path === GUEST_FREE_PLAN_ESSENTIALS_HREF || path.startsWith(`${GUEST_FREE_PLAN_ESSENTIALS_HREF}/`)) {
    return false
  }
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
