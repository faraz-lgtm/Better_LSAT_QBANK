import { type ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"

import {
  isLsacContentPath,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"

/**
 * Blocks Academy / Prep / Insights routes until LawHub coach is eligible.
 * Dashboard stays open so the setup card can complete linking.
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
