import { describe, expect, it } from "vitest"

import { resolvePostAuthDestination } from "./post-auth-redirect"
import type { UserEntitlement, UserProfile } from "@/lib/api/users"

const baseStudent: UserProfile = {
  id: "u-1",
  email: "x@example.com",
  full_name: "X",
  role: "student",
  is_first_time_login: false,
  student_coaching_id: null,
  created_at: "",
  updated_at: "",
}

const fullAccessEntitlement: UserEntitlement = {
  isAuthenticated: true,
  isLsacLinked: true,
  isLsacEligible: true,
  hasActiveCore: true,
  accessState: "FULL_ACCESS",
}

describe("resolvePostAuthDestination", () => {
  it("returns onboarding when profile is missing", () => {
    expect(resolvePostAuthDestination(null, null)).toBe("/onboarding")
  })

  it("returns onboarding when student is first-time login", () => {
    expect(
      resolvePostAuthDestination(
        { ...baseStudent, is_first_time_login: true },
        fullAccessEntitlement,
      ),
    ).toBe("/onboarding")
  })

  it("returns pricing when entitlement is PAYMENT_REQUIRED", () => {
    expect(
      resolvePostAuthDestination(baseStudent, {
        ...fullAccessEntitlement,
        hasActiveCore: false,
        accessState: "PAYMENT_REQUIRED",
      }),
    ).toBe("/app/pricing")
  })

  it("returns lsac-link when entitlement is LSAC_REQUIRED", () => {
    expect(
      resolvePostAuthDestination(baseStudent, {
        ...fullAccessEntitlement,
        isLsacEligible: false,
        accessState: "LSAC_REQUIRED",
      }),
    ).toBe("/app/lsac-link")
  })

  it("returns app when entitlement is FULL_ACCESS", () => {
    expect(resolvePostAuthDestination(baseStudent, fullAccessEntitlement)).toBe("/app")
  })

  it("defaults to pricing when entitlement payload is missing", () => {
    expect(resolvePostAuthDestination(baseStudent, null)).toBe("/app/pricing")
  })
})
