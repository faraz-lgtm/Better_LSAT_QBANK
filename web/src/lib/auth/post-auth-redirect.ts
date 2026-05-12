import type { UserProfile } from "@/lib/api/users"

/**
 * Temporary local-testing gate: onboarding is required only on the first login.
 */
export function getPostAuthDestination(profile: UserProfile | null): "/app" | "/admin" | "/onboarding" {
  if (!profile) return "/onboarding"
  if (profile.role === "admin") return "/admin"
  return profile.is_first_time_login ? "/onboarding" : "/app"
}
