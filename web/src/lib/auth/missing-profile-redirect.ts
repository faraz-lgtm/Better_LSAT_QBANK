/**
 * Authenticated users without an app `profiles` row (common right after Google
 * OAuth) or still marked first-time login must finish onboarding before student
 * routes like `/app` or `/diagnostic/start`.
 */
export function shouldRedirectAuthenticatedUserToOnboarding(
  authChecked: boolean,
  profile: { is_first_time_login?: boolean } | null | unknown,
): boolean {
  if (!authChecked) return false
  if (profile == null) return true
  if (
    typeof profile === "object" &&
    "is_first_time_login" in profile &&
    (profile as { is_first_time_login?: boolean }).is_first_time_login === true
  ) {
    return true
  }
  return false
}
