import { type ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"

import {
  isLsacContentPath,
  useStudentEntitlement,
} from "@/features/app-shell/student-entitlement-context"
import { StudentPageLoader } from "@/features/student/components/student-page-loader"

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

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--primary-0)]">
        <StudentPageLoader centered label="Loading…" />
      </div>
    )
  }

  if (!canAccessLsacContent) {
    return <Navigate to="/app" replace />
  }

  return children
}

export { RequireLsacContentAccess }
