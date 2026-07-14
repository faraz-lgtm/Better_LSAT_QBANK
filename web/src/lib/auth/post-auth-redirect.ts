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
  | "/intent"
  | "/diagnostic/start"
  | "/app/diagnostic/results"

/**
 * Route students using entitlement state and diagnostic funnel progress.
 * During the intent acquisition funnel, pricing and lsac-link are never used.
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

  if (funnel.funnelActive && funnel.completedDiagnostic) {
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

  if (entitlement) {
    if (entitlement.accessState === "PAYMENT_REQUIRED") {
      logRouteRedirect(from, "/intent", "PAYMENT_REQUIRED; no diagnostic yet")
      return "/intent"
    }
    if (entitlement.accessState === "LSAC_REQUIRED") {
      logRouteRedirect(from, "/app/lsac-link", "LSAC_REQUIRED")
      return "/app/lsac-link"
    }
    logRouteRedirect(from, "/app", "FULL_ACCESS")
    return "/app"
  }

  logRouteRedirect(from, "/intent", "no entitlement payload; default to intent")
  return "/intent"
}

/** @deprecated Prefer resolvePostAuthDestination with getEntitlementState. */
export function getPostAuthDestination(profile: UserProfile | null): PostAuthDestination {
  return resolvePostAuthDestination(profile, null)
}
