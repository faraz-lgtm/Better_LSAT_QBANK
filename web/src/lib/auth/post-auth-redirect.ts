import type { UserEntitlement, UserProfile } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"

export type PostAuthDestination = "/app" | "/admin" | "/onboarding" | "/app/pricing" | "/app/lsac-link"

/**
 * Route students to the app after auth. Payment and LawHub setup are soft-gated
 * inside the dashboard — not hard walls after login.
 */
export function resolvePostAuthDestination(
  profile: UserProfile | null,
  entitlement: UserEntitlement | null,
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
  if (profile.is_first_time_login) {
    logRouteRedirect(from, "/onboarding", "first-time login")
    return "/onboarding"
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
