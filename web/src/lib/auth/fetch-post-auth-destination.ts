import {
  ensureEntitlement,
  ensureProfile,
} from "@/features/student-session/ensure-student-session"
import { readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { resolvePostAuthDestination, type PostAuthDestination } from "@/lib/auth/post-auth-redirect"

/**
 * Resolve post-auth redirect using the shared student session cache.
 * The usersApi argument is kept for call-site compatibility; loads go through Redux.
 */
export async function fetchPostAuthDestination(
  _usersApi?: unknown,
): Promise<PostAuthDestination> {
  const funnel = readDiagnosticFunnelState()
  const profile = await ensureProfile()
  if (!profile) return resolvePostAuthDestination(null, null, funnel)
  const entitlement = await ensureEntitlement()
  return resolvePostAuthDestination(profile, entitlement, funnel)
}
