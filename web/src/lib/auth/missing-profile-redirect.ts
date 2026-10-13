/**
 * Authenticated users without an app `profiles` row (common right after Google
 * OAuth) must finish onboarding before student routes like `/diagnostic/start`.
 */
export function shouldRedirectAuthenticatedUserToOnboarding(
  authChecked: boolean,
  profile: unknown | null,
): boolean {
  return authChecked && profile == null
}
