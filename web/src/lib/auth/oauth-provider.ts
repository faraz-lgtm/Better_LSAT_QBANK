import type { User } from "@supabase/supabase-js"

/**
 * Google OAuth users do not need password setup during onboarding.
 */
export function isGoogleLinkedUser(user: User | null): boolean {
  if (!user) return false
  const provider = typeof user.app_metadata?.provider === "string"
    ? user.app_metadata.provider
    : null
  if (provider === "google") return true

  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : []
  if (providers.some((p) => p === "google")) return true

  if (!user.identities?.length) return false
  return user.identities.some((identity) => identity.provider === "google")
}
