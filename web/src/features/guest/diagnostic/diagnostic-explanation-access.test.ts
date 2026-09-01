import { describe, expect, it } from "vitest"

import {
  canShowDiagnosticExplanation,
  canShowDiagnosticResultDetails,
  freeDiagnosticExplanationLimit,
} from "@/features/guest/diagnostic/diagnostic-explanation-access"

describe("freeDiagnosticExplanationLimit", () => {
  it("returns teaser limits by diagnostic type", () => {
    expect(freeDiagnosticExplanationLimit("mini")).toBe(5)
    expect(freeDiagnosticExplanationLimit("quick")).toBe(25)
    expect(freeDiagnosticExplanationLimit("full")).toBe(10)
  })
})

describe("canShowDiagnosticExplanation", () => {
  it("allows all questions for premium students", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 10, hasActiveCore: true }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 25, hasActiveCore: true }),
    ).toBe(true)
  })

  it("limits free mini to first 5 and free section to all 25", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 25, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 26, hasActiveCore: false }),
    ).toBe(false)
  })
})

describe("canShowDiagnosticResultDetails", () => {
  it("unlocks every section result row for premium students", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 25, hasActiveCore: true }),
    ).toBe(true)
  })

  it("unlocks only the first 5 Mini rows and all 25 Section rows for free students", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 25, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
  })
})
