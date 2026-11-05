import { type ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"

import {
  isLsacContentPath,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"
import { isInsightsBrowsePath } from "@/features/student/analytics/analytics-routes"
import { isPracticeDrillsListPath } from "@/features/student/drills/drill-routes"
import { isExplanationsListPath } from "@/features/student/explanation-detail/explanation-routes"
import { PREPTEST_LIST_HREF } from "@/features/student/preptests/preptest-routes"
import { isPracticeSectionsListPath } from "@/features/student/sections/section-routes"

function isFreePlanPrepTestPath(pathname: string): boolean {
  return pathname === PREPTEST_LIST_HREF || pathname.startsWith(`${PREPTEST_LIST_HREF}/`)
}

function isLockedBrowsePreviewPath(pathname: string): boolean {
  return (
    isFreePlanPrepTestPath(pathname) ||
    isExplanationsListPath(pathname) ||
    isPracticeDrillsListPath(pathname) ||
    isPracticeSectionsListPath(pathname) ||
    isInsightsBrowsePath(pathname)
  )
}

/**
 * Soft-locks Academy / Prep / Insights (LawHub pool) routes until coach is eligible.
 * Sends locked visits back to `/app`. Account, settings, dashboard, and setup stay reachable;
 * post-checkout soft-lands on `/app/lsac-link-step` with a Link LSAC header CTA.
 * Free-plan and premium+LSAC-setup users may browse PrepTests, Academy Explanations,
 * Prep Drills, Sections, and Insights (actions gated in-page behind upgrade / Link LSAC).
 */
function RequireLsacContentAccess({ children }: { children: ReactElement }) {
  const location = useLocation()
  const { loading, canAccessLsacContent, isPaymentRequired, isLsacSetupRequired } =
    useStudentEntitlement()

  if (!isLsacContentPath(location.pathname)) {
    return children
  }

  if ((isPaymentRequired || isLsacSetupRequired) && isLockedBrowsePreviewPath(location.pathname)) {
    return children
  }

  if (!loading && !canAccessLsacContent) {
    return <Navigate to="/app" replace />
  }

  return children
}

export { RequireLsacContentAccess }
