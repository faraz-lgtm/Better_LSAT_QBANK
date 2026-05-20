import type { Session, User } from "@supabase/supabase-js"

import { isGoogleLinkedUser } from "@/lib/auth/oauth-provider"

type AmrEntry = { method?: string }

function getSessionAmr(session: Session | null): AmrEntry[] {
  const token = session?.access_token
  if (!token) return []
  const parts = token.split(".")
  if (parts.length < 2) return []
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      amr?: AmrEntry[]
    }
    return Array.isArray(payload.amr) ? payload.amr : []
  } catch {
    return []
  }
}

/** True when this session was established via email + password sign-in. */
export function sessionUsedPasswordAuth(session: Session | null): boolean {
  return getSessionAmr(session).some((entry) => entry.method === "password")
}

/**
 * First-time onboarding should set a password only for email users who did not
 * already authenticate with a password (e.g. magic link or invite).
 */
export function userNeedsPasswordSetup(user: User | null, session: Session | null): boolean {
  if (!user) return false
  if (isGoogleLinkedUser(user)) return false
  if (sessionUsedPasswordAuth(session)) return false
  return true
}
