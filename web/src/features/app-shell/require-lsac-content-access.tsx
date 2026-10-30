import { type ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"

import {
  isLsacContentPath,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"
import { isPracticeDrillsListPath } from "@/features/student/drills/drill-routes"
import { isExplanationsListPath } from "@/features/student/explanation-detail/explanation-routes"
import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"
import { isPracticeSectionsListPath } from "@/features/student/sections/section-routes"

function isFreePlanPrepTestPath(pathname: string): boolean {
  return pathname === PREPTEST_LIST_HREF || pathname.startsWith(`${PREPTEST_LIST_HREF}/`)
}

/**
 * Soft-locks Academy / Prep / Insights (LawHub pool) routes until coach is eligible.
 * Sends locked visits back to `/app`. Account, settings, dashboard, and setup stay reachable;
 * post-checkout soft-lands on `/app/lsac-link-step` with a Link LSAC header CTA.
 * Free-plan users may browse PrepTests, Academy Explanations, Prep Drills, and Sections
 * (all gated in-page behind upgrade).
 */
function RequireLsacContentAccess({ children }: { children: ReactElement }) {
  const location = useLocation()
  const { loading, canAccessLsacContent, isPaymentRequired } = useStudentEntitlement()

  if (!isLsacContentPath(location.pathname)) {
    return children
  }

  if (
    isPaymentRequired &&
    (isFreePlanPrepTestPath(location.pathname) ||
      isExplanationsListPath(location.pathname) ||
      isPracticeDrillsListPath(location.pathname) ||
      isPracticeSectionsListPath(location.pathname))
  ) {
    return children
  }

  if (!loading && !canAccessLsacContent) {
    return <Navigate to="/app" replace />
  }

  return children
}

export { RequireLsacContentAccess }
