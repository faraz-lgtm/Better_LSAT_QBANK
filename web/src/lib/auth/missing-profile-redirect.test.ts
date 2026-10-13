import { describe, expect, it } from "vitest"

import { shouldRedirectAuthenticatedUserToOnboarding } from "./missing-profile-redirect"

describe("shouldRedirectAuthenticatedUserToOnboarding", () => {
  it("returns false while profile fetch is still in flight", () => {
    expect(shouldRedirectAuthenticatedUserToOnboarding(false, null)).toBe(false)
  })

  it("returns true when auth finished and profile is missing", () => {
    expect(shouldRedirectAuthenticatedUserToOnboarding(true, null)).toBe(true)
  })

  it("returns false when a profile exists", () => {
    expect(shouldRedirectAuthenticatedUserToOnboarding(true, { id: "u1" })).toBe(false)
  })
})
