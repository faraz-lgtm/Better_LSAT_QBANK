import { describe, expect, it } from "vitest"

import {
  needsLsacLink,
  resolveAccountLsacLinkState,
} from "@/lib/auth/needs-lsac-link"
import type { UserEntitlement, UserProfile } from "@/lib/api/users"

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    email: "student@example.com",
    full_name: "Test Student",
    first_name: "Test",
    last_name: "Student",
    phone: null,
    role: "student",
    student_coaching_id: null,
    is_first_time_login: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function entitlement(overrides: Partial<UserEntitlement> = {}): UserEntitlement {
  return {
    isAuthenticated: true,
    isLsacLinked: false,
    isLsacEligible: false,
    hasActiveCore: true,
    accessState: "LSAC_REQUIRED",
    ...overrides,
  }
}

describe("needsLsacLink", () => {
  it("requires link when profile is missing or coaching id empty", () => {
    expect(needsLsacLink(null)).toBe(true)
    expect(needsLsacLink(profile())).toBe(true)
    expect(needsLsacLink(profile({ student_coaching_id: "   " }))).toBe(true)
  })

  it("requires link for pending coaching placeholders", () => {
    expect(needsLsacLink(profile({ student_coaching_id: "pending-abc" }))).toBe(true)
  })

  it("does not require link for a real coaching id", () => {
    expect(needsLsacLink(profile({ student_coaching_id: "b1695b67-4e2e-45e8-b" }))).toBe(false)
  })
})

describe("resolveAccountLsacLinkState", () => {
  it("shows linked when LawHub snapshot is eligible (real student)", () => {
    expect(
      resolveAccountLsacLinkState(
        profile({ student_coaching_id: "b1695b67-4e2e-45e8-b" }),
        entitlement({
          isLsacLinked: true,
          isLsacEligible: true,
          accessState: "FULL_ACCESS",
        }),
      ),
    ).toBe("linked")
  })

  it("shows pending when coaching id exists but student is not yet eligible", () => {
    expect(
      resolveAccountLsacLinkState(
        profile({ student_coaching_id: "pending-01f8c0bd" }),
        entitlement({ isLsacLinked: true, isLsacEligible: false }),
      ),
    ).toBe("pending")
  })

  it("shows unlinked when there is no coaching id", () => {
    expect(resolveAccountLsacLinkState(profile(), entitlement())).toBe("unlinked")
  })

  it("falls back to profile coaching id when entitlement is unavailable", () => {
    expect(
      resolveAccountLsacLinkState(profile({ student_coaching_id: "4e953b65-5704-4e5d-8" }), null),
    ).toBe("linked")
  })
})
