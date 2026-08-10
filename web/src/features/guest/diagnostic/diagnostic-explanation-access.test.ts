import { describe, expect, it } from "vitest"

import {
  canShowDiagnosticExplanation,
  freeDiagnosticExplanationLimit,
} from "@/features/guest/diagnostic/diagnostic-explanation-access"

describe("freeDiagnosticExplanationLimit", () => {
  it("returns teaser limits by diagnostic type", () => {
    expect(freeDiagnosticExplanationLimit("mini")).toBe(5)
    expect(freeDiagnosticExplanationLimit("quick")).toBe(10)
    expect(freeDiagnosticExplanationLimit("full")).toBe(10)
  })
})

describe("canShowDiagnosticExplanation", () => {
  it("allows all questions for premium students", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 10, hasActiveCore: true }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 30, hasActiveCore: true }),
    ).toBe(true)
  })

  it("limits free mini to first 5 and free quick to first 10", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
  })
})
