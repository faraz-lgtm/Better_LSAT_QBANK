import { beforeEach, describe, expect, it } from "vitest"

import {
  clearDiagnosticFunnel,
  DIAGNOSTIC_FUNNEL_ACTIVE_KEY,
  DIAGNOSTIC_INTENT_STORAGE_KEY,
  hasPendingDiagnosticIntent,
  isDiagnosticFunnelActive,
  isInDiagnosticAcquisitionFunnel,
  markDiagnosticFunnelActive,
  readDiagnosticIntent,
  saveDiagnosticIntent,
} from "./diagnostic-intent"

describe("diagnostic-intent storage", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it("saves intent to sessionStorage and localStorage", () => {
    saveDiagnosticIntent("quick")
    expect(sessionStorage.getItem(DIAGNOSTIC_INTENT_STORAGE_KEY)).toBe("quick")
    expect(localStorage.getItem(DIAGNOSTIC_INTENT_STORAGE_KEY)).toBe("quick")
    expect(isDiagnosticFunnelActive()).toBe(true)
    expect(readDiagnosticIntent()).toBe("quick")
    expect(hasPendingDiagnosticIntent()).toBe(true)
  })

  it("reads intent from localStorage when sessionStorage is empty", () => {
    localStorage.setItem(DIAGNOSTIC_INTENT_STORAGE_KEY, "mini")
    markDiagnosticFunnelActive()
    expect(readDiagnosticIntent()).toBe("mini")
    expect(isInDiagnosticAcquisitionFunnel()).toBe(true)
  })

  it("clears funnel state", () => {
    saveDiagnosticIntent("mini")
    clearDiagnosticFunnel()
    expect(readDiagnosticIntent()).toBeNull()
    expect(isDiagnosticFunnelActive()).toBe(false)
    expect(localStorage.getItem(DIAGNOSTIC_FUNNEL_ACTIVE_KEY)).toBeNull()
  })
})
