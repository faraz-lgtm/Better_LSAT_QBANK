import { describe, expect, it } from "vitest"

import {
  buildDiagnosticResultExplanation,
  createGuestDiagnosticPreviewQuestions,
  getMiniDiagnosticExplanationHtml,
} from "@/features/guest/diagnostic/mini-diagnostic-content"

describe("Full diagnostic question content", () => {
  it("reuses mini explanations for Full preview question ids", () => {
    const questions = createGuestDiagnosticPreviewQuestions(30)
    expect(questions).toHaveLength(30)
    expect(questions[0]?.id).toBe("guest-diagnostic-preview-q1")
    expect(getMiniDiagnosticExplanationHtml("guest-diagnostic-preview-q1")).toEqual(
      getMiniDiagnosticExplanationHtml("mini-diag-q1"),
    )
    expect(getMiniDiagnosticExplanationHtml("guest-diagnostic-preview-q11")).toBeTruthy()
    expect(buildDiagnosticResultExplanation("guest-diagnostic-preview-q11")?.stemText).toBeTruthy()
  })
})
