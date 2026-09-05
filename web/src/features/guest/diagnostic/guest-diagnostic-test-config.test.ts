import { describe, expect, it } from "vitest"

import {
  formatDiagnosticTimeMinutes,
  getGuestDiagnosticTestConfig,
  isGuestDiagnosticIntentId,
} from "@/features/guest/diagnostic/guest-diagnostic-test-config"

describe("guest diagnostic test config", () => {
  it("maps each intent to question count and time", () => {
    expect(getGuestDiagnosticTestConfig("mini")).toMatchObject({
      title: "Mini Diagnostic - Test Instructions",
      questionCount: 10,
      timeMinutes: 13,
    })
    expect(getGuestDiagnosticTestConfig("quick")).toMatchObject({
      title: "Full Section Diagnostic - Test Instructions",
      questionCount: 25,
      timeMinutes: 35,
    })
    expect(getGuestDiagnosticTestConfig("full")).toMatchObject({
      title: "Full Diagnostic - Test Instructions",
      questionCount: 115,
      timeMinutes: 90,
    })
  })

  it("formats diagnostic time labels", () => {
    expect(formatDiagnosticTimeMinutes(13)).toBe("13 minutes")
    expect(formatDiagnosticTimeMinutes(1)).toBe("1 minute")
  })

  it("validates stored intent ids", () => {
    expect(isGuestDiagnosticIntentId("mini")).toBe(true)
    expect(isGuestDiagnosticIntentId("quick")).toBe(true)
    expect(isGuestDiagnosticIntentId("full")).toBe(true)
    expect(isGuestDiagnosticIntentId("other")).toBe(false)
  })
})
