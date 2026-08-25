import { describe, expect, it } from "vitest"

import { resolvePostAuthDestination } from "./post-auth-redirect"
import type { DiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import type { UserEntitlement, UserProfile } from "@/lib/api/users"

const baseStudent: UserProfile = {
  id: "u-1",
  email: "x@example.com",
  full_name: "X Y",
  first_name: "X",
  last_name: "Y",
  phone: null,
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

const lsacRequiredEntitlement: UserEntitlement = {
  ...fullAccessEntitlement,
  isLsacEligible: false,
  accessState: "LSAC_REQUIRED",
}

const emptyFunnel: DiagnosticFunnelState = {
  pendingIntent: null,
  completedDiagnostic: false,
  funnelActive: false,
  inAcquisitionFunnel: false,
}

const acquisitionFunnel: DiagnosticFunnelState = {
  pendingIntent: "quick",
  completedDiagnostic: false,
  funnelActive: true,
  inAcquisitionFunnel: true,
}

const completedFunnel: DiagnosticFunnelState = {
  pendingIntent: null,
  completedDiagnostic: true,
  funnelActive: true,
  inAcquisitionFunnel: false,
}

describe("resolvePostAuthDestination", () => {
  it("returns onboarding when profile is missing", () => {
    expect(resolvePostAuthDestination(null, null, emptyFunnel)).toBe("/onboarding")
  })

  it("returns admin for admin role", () => {
    expect(
      resolvePostAuthDestination(
        { ...baseStudent, role: "admin" },
        fullAccessEntitlement,
        emptyFunnel,
      ),
    ).toBe("/admin")
  })

  it("returns diagnostic start during acquisition funnel even when LSAC is required", () => {
    expect(
      resolvePostAuthDestination(baseStudent, lsacRequiredEntitlement, acquisitionFunnel),
    ).toBe("/diagnostic/start")
  })

  it("returns diagnostic start during acquisition funnel for first-time login", () => {
    expect(
      resolvePostAuthDestination(
        { ...baseStudent, is_first_time_login: true },
        lsacRequiredEntitlement,
        acquisitionFunnel,
      ),
    ).toBe("/diagnostic/start")
  })

  it("returns diagnostic results when funnel is complete", () => {
    expect(
      resolvePostAuthDestination(baseStudent, lsacRequiredEntitlement, completedFunnel),
    ).toBe("/app/diagnostic/results")
  })

  it("returns onboarding when student is first-time login outside funnel", () => {
    expect(
      resolvePostAuthDestination(
        { ...baseStudent, is_first_time_login: true },
        fullAccessEntitlement,
        emptyFunnel,
      ),
    ).toBe("/onboarding")
  })

  it("returns app when entitlement is PAYMENT_REQUIRED (soft-gate in dashboard)", () => {
    expect(
      resolvePostAuthDestination(baseStudent, {
        ...fullAccessEntitlement,
        hasActiveCore: false,
        accessState: "PAYMENT_REQUIRED",
      }, emptyFunnel),
    ).toBe("/app")
  })

  it("returns app when entitlement is LSAC_REQUIRED outside funnel (soft-gate in dashboard)", () => {
    expect(
      resolvePostAuthDestination(baseStudent, lsacRequiredEntitlement, emptyFunnel),
    ).toBe("/app")
  })

  it("returns app when entitlement is FULL_ACCESS", () => {
    expect(resolvePostAuthDestination(baseStudent, fullAccessEntitlement, emptyFunnel)).toBe("/app")
  })

  it("defaults to app when entitlement payload is missing", () => {
    expect(resolvePostAuthDestination(baseStudent, null, emptyFunnel)).toBe("/app")
  })
})
