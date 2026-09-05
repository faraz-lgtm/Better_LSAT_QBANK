import { describe, expect, it } from "vitest"

import {
  canShowDiagnosticExplanation,
  canShowDiagnosticResultDetails,
  freeDiagnosticExplanationLimit,
  FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT,
  FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT,
} from "@/features/guest/diagnostic/diagnostic-explanation-access"

describe("freeDiagnosticExplanationLimit", () => {
  it("returns 5 for mini and 10 for full section / full", () => {
    expect(FREE_MINI_DIAGNOSTIC_EXPLANATION_LIMIT).toBe(5)
    expect(FREE_FULL_DIAGNOSTIC_EXPLANATION_LIMIT).toBe(10)
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
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 25, hasActiveCore: true }),
    ).toBe(true)
  })

  it("limits free mini to the first 5 questions", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
  })

  it("limits free full section and full to the first 10 questions", () => {
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "quick", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticExplanation({ intentId: "full", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticExplanation({ intentId: "full", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
  })
})

describe("canShowDiagnosticResultDetails", () => {
  it("unlocks every section result row for premium students", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 25, hasActiveCore: true }),
    ).toBe(true)
  })

  it("unlocks only the first 5 rows for free students on mini", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 5, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "mini", questionNumber: 6, hasActiveCore: false }),
    ).toBe(false)
  })

  it("unlocks only the first 10 rows for free students on full section", () => {
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "quick", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 10, hasActiveCore: false }),
    ).toBe(true)
    expect(
      canShowDiagnosticResultDetails({ intentId: "full", questionNumber: 11, hasActiveCore: false }),
    ).toBe(false)
  })
})
