import { describe, expect, it } from "vitest"

import { shouldRedirectAuthenticatedUserToOnboarding } from "./missing-profile-redirect"

describe("shouldRedirectAuthenticatedUserToOnboarding", () => {
  it("returns false while profile fetch is still in flight", () => {
    expect(shouldRedirectAuthenticatedUserToOnboarding(false, null)).toBe(false)
  })

  it("returns true when auth finished and profile is missing", () => {
    expect(shouldRedirectAuthenticatedUserToOnboarding(true, null)).toBe(true)
  })

  it("returns false when a completed profile exists", () => {
    expect(
      shouldRedirectAuthenticatedUserToOnboarding(true, {
        id: "u1",
        is_first_time_login: false,
      }),
    ).toBe(false)
  })

  it("returns true when profile exists but first-time login is still set", () => {
    expect(
      shouldRedirectAuthenticatedUserToOnboarding(true, {
        id: "u1",
        is_first_time_login: true,
      }),
    ).toBe(true)
  })

  it("does not treat a stale logged-out check as ready for onboarding redirect", () => {
    // PublicOnly leaves profileChecked=true after a logged-out visit. On SIGNED_IN
    // the guard must set profileChecked=false until ensureProfile finishes — otherwise
    // (true, null) incorrectly flashes /onboarding for returning users.
    expect(shouldRedirectAuthenticatedUserToOnboarding(false, null)).toBe(false)
  })
})
