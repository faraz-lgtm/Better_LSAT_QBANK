import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { StudentPageLoader } from "@/features/student/components/student-page-loader"
import { AuthLayout } from "@/features/auth/components/auth-layout"
import { createUsersApi } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

/**
 * Legacy LawHub wall route. Payment / coach linking now soft-gate on the dashboard.
 * Keep this path so old bookmarks and Stripe success URLs still land in-app.
 */
function LsacLinkPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const checkoutSuccess = searchParams.get("checkout") === "success"
  const [ready, setReady] = useState(false)

  const usersApi = useMemo(() => {
    try {
      return createUsersApi(getSupabaseBrowserClient())
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let alive = true
    async function redirect() {
      const checkoutQuery = checkoutSuccess ? "?checkout=success" : ""
      const target = `/app${checkoutQuery}`

      if (!usersApi) {
        logRouteRedirect("/app/lsac-link", target, "no users api; soft-gate redirect")
        navigate(target, { replace: true })
        return
      }

      try {
        const profile = await usersApi.getMyProfile()
        if (!alive) return
        if (!profile) {
          logRouteRedirect("/app/lsac-link", "/login", "no profile on load")
          navigate("/login", { replace: true })
          return
        }
      } catch {
        // Still send authenticated sessions into the app; dashboard handles setup.
      }

      if (!alive) return
      logRouteRedirect("/app/lsac-link", target, "soft-gate redirect to dashboard")
      navigate(target, { replace: true })
    }

    void redirect().finally(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [checkoutSuccess, navigate, usersApi])

  return (
    <AuthLayout ctaLabel="Log In" ctaHref="/login" headerVariant="app" contentLayout="lsac-link">
      {!ready ? <StudentPageLoader centered label="Loading…" /> : null}
    </AuthLayout>
  )
}

export { LsacLinkPage }
