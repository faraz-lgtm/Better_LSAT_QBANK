import { describe, expect, it } from "vitest"

import {
  buildDiagnosticResultExplanation,
  createDiagnosticQuestions,
  createSectionDiagnosticQuestions,
  getDiagnosticExplanationHtml,
  SECTION_DIAGNOSTIC_MARKETING_SET,
} from "@/features/guest/diagnostic/mini-diagnostic-content"

describe("Section diagnostic question content", () => {
  it("loads all 25 section diagnostic questions with explanations", () => {
    const questions = createSectionDiagnosticQuestions()
    expect(questions).toHaveLength(25)
    expect(questions[0]?.id).toBe("section-diag-q1")
    expect(getDiagnosticExplanationHtml("section-diag-q1", "quick")).toBeTruthy()
    expect(getDiagnosticExplanationHtml("section-diag-q25", "quick")).toBeTruthy()
    expect(buildDiagnosticResultExplanation("section-diag-q25", "quick")?.stemText).toBeTruthy()
  })

  it("creates quick intent questions from the section set", () => {
    const questions = createDiagnosticQuestions("quick")
    expect(questions).toHaveLength(25)
    expect(SECTION_DIAGNOSTIC_MARKETING_SET.questionCount).toBe(25)
    expect(SECTION_DIAGNOSTIC_MARKETING_SET.timeMinutes).toBe(35)
  })
})
