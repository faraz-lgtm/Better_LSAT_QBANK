import type { UserEntitlement, UserProfile } from "@/lib/api/users"
import {
  ensureDiagnosticIntent,
  type DiagnosticFunnelState,
  readDiagnosticFunnelState,
} from "@/lib/auth/diagnostic-intent"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"

export type PostAuthDestination =
  | "/app"
  | "/admin"
  | "/onboarding"
  | "/app/pricing"
  | "/app/lsac-link"
  | "/app/lsac-link-step"
  | "/intent"
  | "/diagnostic/start"
  | "/app/diagnostic/results"

/**
 * Route students using diagnostic funnel progress when active.
 * Outside the funnel, payment stays soft-gated on the dashboard; LawHub coach
 * setup hard-redirects to /app/lsac-link-step when subscribed but not eligible.
 */
export function resolvePostAuthDestination(
  profile: UserProfile | null,
  entitlement: UserEntitlement | null,
  funnel: DiagnosticFunnelState = readDiagnosticFunnelState(),
): PostAuthDestination {
  const from = "post-auth"

  if (!profile) {
    logRouteRedirect(from, "/onboarding", "no profile")
    return "/onboarding"
  }
  if (profile.role === "admin" || profile.role === "super_admin") {
    logRouteRedirect(from, "/admin", "admin role", { role: profile.role })
    return "/admin"
  }

  if (funnel.inAcquisitionFunnel) {
    ensureDiagnosticIntent()
    logRouteRedirect(from, "/diagnostic/start", "diagnostic acquisition funnel")
    return "/diagnostic/start"
  }

  // Prefer results when the exam is done. clearDiagnosticFunnel() clears funnelActive
  // on submit, so first-time students must not fall through to /onboarding.
  if (
    funnel.completedDiagnostic &&
    (funnel.funnelActive || profile.is_first_time_login)
  ) {
    logRouteRedirect(from, "/app/diagnostic/results", "diagnostic funnel complete")
    return "/app/diagnostic/results"
  }

  if (funnel.pendingIntent) {
    ensureDiagnosticIntent()
    logRouteRedirect(from, "/diagnostic/start", "pending diagnostic intent")
    return "/diagnostic/start"
  }

  if (profile.is_first_time_login) {
    logRouteRedirect(from, "/onboarding", "first-time login")
    return "/onboarding"
  }

  if (funnel.completedDiagnostic && entitlement?.accessState === "PAYMENT_REQUIRED") {
    logRouteRedirect(from, "/app/diagnostic/results", "completed diagnostic; payment required")
    return "/app/diagnostic/results"
  }

  if (entitlement?.hasActiveCore && !entitlement.isLsacEligible) {
    logRouteRedirect(from, "/app/lsac-link-step", "LawHub setup required", {
      hasActiveCore: entitlement.hasActiveCore,
      isLsacEligible: entitlement.isLsacEligible,
      accessState: entitlement.accessState,
    })
    return "/app/lsac-link-step"
  }

  if (entitlement) {
    logRouteRedirect(from, "/app", entitlement.accessState, {
      hasActiveCore: entitlement.hasActiveCore,
      isLsacEligible: entitlement.isLsacEligible,
    })
  } else {
    logRouteRedirect(from, "/app", "no entitlement payload; soft-gate in dashboard")
  }
  return "/app"
}

/** @deprecated Prefer resolvePostAuthDestination with getEntitlementState. */
export function getPostAuthDestination(profile: UserProfile | null): PostAuthDestination {
  return resolvePostAuthDestination(profile, null)
}
