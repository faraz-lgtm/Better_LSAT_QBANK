import { describe, expect, it } from "vitest"

import { shouldAllowAuthenticatedIntentPage } from "./diagnostic-funnel-redirect"
import type { DiagnosticFunnelState } from "@/lib/auth/diagnostic-intent"
import type { UserEntitlement } from "@/lib/api/users"

const lsacRequired: UserEntitlement = {
  isAuthenticated: true,
  isLsacLinked: true,
  isLsacEligible: false,
  hasActiveCore: true,
  accessState: "LSAC_REQUIRED",
}

const fullAccess: UserEntitlement = {
  isAuthenticated: true,
  isLsacLinked: true,
  isLsacEligible: true,
  hasActiveCore: true,
  accessState: "FULL_ACCESS",
}

describe("shouldAllowAuthenticatedIntentPage", () => {
  it("allows intent during acquisition funnel even with full access", () => {
    const funnel: DiagnosticFunnelState = {
      pendingIntent: "quick",
      completedDiagnostic: false,
      funnelActive: true,
      inAcquisitionFunnel: true,
    }
    expect(shouldAllowAuthenticatedIntentPage(fullAccess, funnel)).toBe(true)
  })

  it("allows intent when LSAC is required during acquisition funnel", () => {
    const funnel: DiagnosticFunnelState = {
      pendingIntent: "quick",
      completedDiagnostic: false,
      funnelActive: true,
      inAcquisitionFunnel: true,
    }
    expect(shouldAllowAuthenticatedIntentPage(lsacRequired, funnel)).toBe(true)
  })

  it("allows intent for fully entitled users who completed diagnostic (sidebar retake)", () => {
    const funnel: DiagnosticFunnelState = {
      pendingIntent: null,
      completedDiagnostic: true,
      funnelActive: false,
      inAcquisitionFunnel: false,
    }
    expect(shouldAllowAuthenticatedIntentPage(fullAccess, funnel)).toBe(true)
  })
})
