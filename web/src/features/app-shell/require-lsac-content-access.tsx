import { type ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"

import {
  isLsacContentPath,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"

/**
 * Soft-locks Academy / Prep / Insights (LawHub pool) routes until coach is eligible.
 * Sends locked visits back to `/app`. Account, settings, dashboard, and setup stay reachable;
 * post-checkout soft-lands on `/app/lsac-link-step` with a Link LSAC header CTA.
 */
function RequireLsacContentAccess({ children }: { children: ReactElement }) {
  const location = useLocation()
  const { loading, canAccessLsacContent } = useStudentEntitlement()

  if (!isLsacContentPath(location.pathname)) {
    return children
  }

  if (!loading && !canAccessLsacContent) {
    return <Navigate to="/app" replace />
  }

  return children
}

export { RequireLsacContentAccess }
