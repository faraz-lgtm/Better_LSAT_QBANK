import { describe, expect, it } from "vitest"

import {
  parseAnswerChoiceExplanationMap,
  splitDiagnosticExplanationHtml,
} from "@/features/guest/diagnostic/split-diagnostic-explanation-html"
import {
  createMiniDiagnosticQuestions,
  createSectionDiagnosticQuestions,
  getDiagnosticStimulusAnalysisHtml,
} from "@/features/guest/diagnostic/mini-diagnostic-content"
import { MINI_DIAGNOSTIC_QUESTIONS } from "@data/diagnostics/mini-marketing-questions.ts"
import { SECTION_DIAGNOSTIC_QUESTIONS } from "@data/diagnostics/section-marketing-questions.ts"

describe("splitDiagnosticExplanationHtml", () => {
  it("splits Stimulus Analysis for Analysis View and Answer Choice Analysis for choices", () => {
    const html = `<h3>Stimulus Analysis</h3>
<p>Stimulus body only.</p>
<h3>Answer Choice Analysis</h3>
<p><strong>A)</strong> Incorrect. Not the conclusion.</p>
<p><strong>B)</strong> Correct. Paraphrase of the main claim.</p>`

    const { stimulusAnalysisHtml, answerChoiceAnalysisHtml } = splitDiagnosticExplanationHtml(html)

    expect(stimulusAnalysisHtml).toContain("Stimulus body only.")
    expect(stimulusAnalysisHtml).not.toMatch(/Stimulus Analysis/i)
    expect(stimulusAnalysisHtml).not.toContain("Incorrect. Not the conclusion.")
    expect(answerChoiceAnalysisHtml).toContain("<strong>A)</strong>")
    expect(answerChoiceAnalysisHtml).not.toMatch(/Answer Choice Analysis/i)

    const byLetter = parseAnswerChoiceExplanationMap(answerChoiceAnalysisHtml)
    expect(byLetter.A).toBe("<p>Incorrect. Not the conclusion.</p>")
    expect(byLetter.B).toBe("<p>Correct. Paraphrase of the main claim.</p>")
  })
})

describe("Section diagnostic explanation placement", () => {
  it("exposes Stimulus Analysis only via getDiagnosticStimulusAnalysisHtml", () => {
    const stimulus = getDiagnosticStimulusAnalysisHtml("section-diag-q1", "quick")
    expect(stimulus).toBeTruthy()
    expect(stimulus).not.toMatch(/Answer Choice Analysis/i)
    expect(stimulus).not.toMatch(/<strong>\s*[A-E]\)/i)
  })

  it("maps Answer Choice Analysis onto drill choice explanations", () => {
    const questions = createSectionDiagnosticQuestions()
    const q1 = questions[0]!
    expect(q1.choices.find((c) => c.id === "B")?.explanationHtml).toMatch(/Correct/i)
    expect(q1.choices.find((c) => c.id === "A")?.explanationHtml).toMatch(/Incorrect/i)

    for (const source of SECTION_DIAGNOSTIC_QUESTIONS) {
      const { stimulusAnalysisHtml, answerChoiceAnalysisHtml } = splitDiagnosticExplanationHtml(
        source.explanationHtml,
      )
      expect(stimulusAnalysisHtml.trim().length).toBeGreaterThan(0)
      expect(answerChoiceAnalysisHtml.trim().length).toBeGreaterThan(0)
      const map = parseAnswerChoiceExplanationMap(answerChoiceAnalysisHtml)
      expect(Object.keys(map).sort().join("")).toBe("ABCDE")
    }
  })
})

describe("Mini diagnostic explanation placement", () => {
  it("exposes Stimulus Analysis only via getDiagnosticStimulusAnalysisHtml", () => {
    const stimulus = getDiagnosticStimulusAnalysisHtml("mini-diag-q1", "mini")
    expect(stimulus).toBeTruthy()
    expect(stimulus).not.toMatch(/Answer Choice Analysis/i)
    expect(stimulus).not.toMatch(/<strong>\s*[A-E]\)/i)
  })

  it("maps Answer Choice Analysis onto drill choice explanations for all 10 questions", () => {
    const questions = createMiniDiagnosticQuestions()
    expect(questions).toHaveLength(10)
    expect(questions[0]?.choices.find((c) => c.id === "C")?.explanationHtml).toMatch(/Correct/i)
    expect(questions[0]?.choices.find((c) => c.id === "A")?.explanationHtml).toMatch(/Incorrect/i)

    for (const source of MINI_DIAGNOSTIC_QUESTIONS) {
      const { stimulusAnalysisHtml, answerChoiceAnalysisHtml } = splitDiagnosticExplanationHtml(
        source.explanationHtml,
      )
      expect(stimulusAnalysisHtml.trim().length).toBeGreaterThan(0)
      expect(answerChoiceAnalysisHtml.trim().length).toBeGreaterThan(0)
      const map = parseAnswerChoiceExplanationMap(answerChoiceAnalysisHtml)
      expect(Object.keys(map).sort().join("")).toBe("ABCDE")
    }
  })
})
