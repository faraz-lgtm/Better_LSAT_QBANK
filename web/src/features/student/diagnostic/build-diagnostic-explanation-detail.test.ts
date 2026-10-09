import { describe, expect, it } from "vitest"

import { buildDiagnosticExplanationQuestionDetailView } from "@/features/student/diagnostic/build-diagnostic-explanation-detail"

describe("buildDiagnosticExplanationQuestionDetailView free teaser", () => {
  it("keeps Mini Q5 explanations for free accounts", () => {
    const view = buildDiagnosticExplanationQuestionDetailView(
      "mini-diag-q5",
      undefined,
      [],
      null,
      null,
      false,
    )
    expect(view).toBeTruthy()
    expect(view?.questionExplanationHtml?.trim()).toBeTruthy()
    expect(view?.choices.some((choice) => Boolean(choice.explanationHtml?.trim()))).toBe(true)
  })

  it("strips Mini Q6+ explanations for free accounts", () => {
    const view = buildDiagnosticExplanationQuestionDetailView(
      "mini-diag-q6",
      undefined,
      [],
      "https://example.com/video",
      "16 / 9",
      false,
    )
    expect(view).toBeTruthy()
    expect(view?.questionExplanationHtml).toBeFalsy()
    expect(view?.choices.every((choice) => !choice.explanationHtml)).toBe(true)
    expect(view?.videos).toEqual([])
    expect(view?.hasExplanationTab).toBe(false)
  })

  it("strips Full Section Q11+ explanations for free accounts", () => {
    const view = buildDiagnosticExplanationQuestionDetailView(
      "section-diag-q11",
      undefined,
      [],
      null,
      null,
      false,
    )
    expect(view).toBeTruthy()
    expect(view?.questionExplanationHtml).toBeFalsy()
    expect(view?.choices.every((choice) => !choice.explanationHtml)).toBe(true)
  })

  it("keeps locked questions unlocked for premium", () => {
    const view = buildDiagnosticExplanationQuestionDetailView(
      "mini-diag-q6",
      undefined,
      [],
      null,
      null,
      true,
    )
    expect(view?.questionExplanationHtml?.trim()).toBeTruthy()
  })
})
