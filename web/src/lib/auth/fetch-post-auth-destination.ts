import type { createUsersApi } from "@/lib/api/users"
import { readDiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import { resolvePostAuthDestination, type PostAuthDestination } from "@/lib/auth/post-auth-redirect"

export async function fetchPostAuthDestination(
  usersApi: Pick<
    ReturnType<typeof createUsersApi>,
    "getMyProfile" | "getEntitlementState"
  >,
): Promise<PostAuthDestination> {
  const funnel = readDiagnosticFunnelState()
  const profile = await usersApi.getMyProfile()
  if (!profile) return resolvePostAuthDestination(null, null, funnel)
  try {
    const entitlement = await usersApi.getEntitlementState()
    return resolvePostAuthDestination(profile, entitlement, funnel)
  } catch {
    return resolvePostAuthDestination(profile, null, funnel)
  }
}
