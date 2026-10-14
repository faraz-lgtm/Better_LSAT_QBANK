import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"

/**
 * Legacy path. Stripe / bookmarks that hit /app/lsac-link redirect to /app/lsac-link-step.
 */
function LsacLinkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    const qs = next.toString()
    const target = qs ? `/app/lsac-link-step?${qs}` : "/app/lsac-link-step"
    logRouteRedirect("/app/lsac-link", target, "legacy path → app/lsac-link-step")
    navigate(target, { replace: true })
  }, [navigate, searchParams])

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app" contentLayout="lsac-link">
      <StudentPageLoader centered label="Loading…" />
    </AuthLayout>
  )
}

export { LsacLinkPage }
