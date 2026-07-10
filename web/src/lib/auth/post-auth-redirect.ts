import type { UserEntitlement, UserProfile } from "@/lib/api/users"
import { logRouteRedirect } from "@/lib/auth/log-route-redirect"

export type PostAuthDestination = "/app" | "/admin" | "/onboarding" | "/app/pricing" | "/app/lsac-link"

/**
 * Route students using authoritative entitlement state from the backend.
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
    if (entitlement.accessState === "PAYMENT_REQUIRED") {
      logRouteRedirect(from, "/app/pricing", "PAYMENT_REQUIRED")
      return "/app/pricing"
    }
    if (entitlement.accessState === "LSAC_REQUIRED") {
      logRouteRedirect(from, "/app/lsac-link", "LSAC_REQUIRED")
      return "/app/lsac-link"
    }
    logRouteRedirect(from, "/app", "FULL_ACCESS")
    return "/app"
  }

  logRouteRedirect(from, "/app/pricing", "no entitlement payload; default to pricing")
  return "/app/pricing"
}

/** @deprecated Prefer resolvePostAuthDestination with getEntitlementState. */
export function getPostAuthDestination(profile: UserProfile | null): PostAuthDestination {
  return resolvePostAuthDestination(profile, null)
}
