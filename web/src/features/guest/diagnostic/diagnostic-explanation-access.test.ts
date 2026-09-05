import { describe, expect, it } from "vitest"

import {
  canShowDiagnosticExplanation,
  canShowDiagnosticResultDetails,
  freeDiagnosticExplanationLimit,
} from "@/features/guest/diagnostic/diagnostic-explanation-access"

describe("freeDiagnosticExplanationLimit", () => {
  it("returns a 5-question teaser for every diagnostic type", () => {
    expect(freeDiagnosticExplanationLimit("mini")).toBe(5)
    expect(freeDiagnosticExplanationLimit("full")).toBe(5)
    expect(freeDiagnosticExplanationLimit("quick")).toBe(5)
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

  it("limits free mini, full, and section diagnostics to the first 5 questions", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticExplanation({ intentId: "full", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "full", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
  })
})

describe("canShowDiagnosticResultDetails", () => {
  it("unlocks every section result row for premium students", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 25, hasActiveCore: true }),
    ).toBe(true)
  })

  it("unlocks only the first 5 rows for free students on mini and full section", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 7, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
  })
})
