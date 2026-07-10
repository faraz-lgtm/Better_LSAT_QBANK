import type { createUsersApi } from "@/lib/api/users"
import { resolvePostAuthDestination, type PostAuthDestination } from "@/lib/auth/post-auth-redirect"

export async function fetchPostAuthDestination(
  usersApi: Pick<
    ReturnType<typeof createUsersApi>,
    "getMyProfile" | "getEntitlementState"
  >,
): Promise<PostAuthDestination> {
  const profile = await usersApi.getMyProfile()
  if (!profile) return resolvePostAuthDestination(null, null)
  try {
    const entitlement = await usersApi.getEntitlementState()
    return resolvePostAuthDestination(profile, entitlement)
  } catch {
    return resolvePostAuthDestination(profile, null)
  }
}
