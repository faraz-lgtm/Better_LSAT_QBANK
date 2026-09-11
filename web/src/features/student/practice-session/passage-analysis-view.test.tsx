import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  hasPassageAnalysis,
  PassageAnalysisBody,
  resolveAnalysisParagraphs,
} from "@/features/student/practice-session/passage-analysis-view"

describe("hasPassageAnalysis", () => {
  it("is false for null/empty", () => {
    expect(hasPassageAnalysis(null)).toBe(false)
    expect(hasPassageAnalysis({ paragraphs: [], overallHtml: null })).toBe(false)
    expect(hasPassageAnalysis({ paragraphs: [], overallHtml: "   " })).toBe(false)
  })

  it("is true when paragraphs or overall exist", () => {
    expect(
      hasPassageAnalysis({
        paragraphs: [{ label: "P1", explanationHtml: "<p>a</p>" }],
        overallHtml: null,
      }),
    ).toBe(true)
    expect(hasPassageAnalysis({ paragraphs: [], overallHtml: "<p>Overall</p>" })).toBe(true)
  })
})

describe("resolveAnalysisParagraphs", () => {
  it("fills passageHtml from body when missing", () => {
    const resolved = resolveAnalysisParagraphs(
      {
        paragraphs: [
          { label: "P1", explanationHtml: "<p>A1</p>" },
          { label: "P2", explanationHtml: "<p>A2</p>" },
        ],
        overallHtml: null,
      },
      "<p>First</p><p>Second</p>",
    )
    expect(resolved[0]?.passageHtml).toBe("<p>First</p>")
    expect(resolved[1]?.passageHtml).toBe("<p>Second</p>")
  })
})

describe("PassageAnalysisBody", () => {
  it("renders paragraph labels and overall", () => {
    render(
      <PassageAnalysisBody
        passageBody="<p>Body one</p>"
        analysis={{
          paragraphs: [{ label: "P1", explanationHtml: "<p>Para analysis</p>" }],
          overallHtml: "<p>Overall takeaway</p>",
        }}
      />,
    )
    expect(screen.getByText("P1")).toBeInTheDocument()
    expect(screen.getByText("Para analysis")).toBeInTheDocument()
    expect(screen.getByText("Overall")).toBeInTheDocument()
    expect(screen.getByText("Overall takeaway")).toBeInTheDocument()
  })
})
