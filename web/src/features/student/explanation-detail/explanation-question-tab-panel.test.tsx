import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ExplanationQuestionTabPanel } from "./explanation-question-tab-panel"

const baseView = {
  passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
  questionStem: "<p>Which one of the following?</p>",
  questionExplanationHtml: null as string | null,
  questionNumber: 3,
  choices: [{ id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: null }],
  correctChoiceId: "A",
  passageAnalysis: null as
    | {
        paragraphs: Array<{ label: string; explanationHtml: string }>
        overallHtml: string | null
      }
    | null,
}

describe("ExplanationQuestionTabPanel", () => {
  it("renders HTML stem without visible tags", () => {
    render(<ExplanationQuestionTabPanel view={baseView} />)
    expect(screen.getByText("Which one of the following?")).toBeInTheDocument()
    expect(screen.getByText("Passage text")).toBeInTheDocument()
    expect(screen.getByText("Choice A")).toBeInTheDocument()
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument()
  })

  it("keeps question explanation collapsed by default when available", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          questionExplanationHtml: "<p>Question-level explanation</p>",
        }}
      />,
    )

    expect(screen.queryByText("Question-level explanation")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument()
  })

  it("expands question explanation under the stem when toggled", async () => {
    const user = userEvent.setup()
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          questionExplanationHtml: "<p>Question-level explanation</p>",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { expanded: false }))
    expect(screen.getByText("Question-level explanation")).toBeInTheDocument()
  })

  it("shows disabled Show analysis label when no passage analysis", () => {
    render(<ExplanationQuestionTabPanel view={baseView} />)
    expect(screen.getByText("Show analysis")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /show analysis/i })).not.toBeInTheDocument()
  })

  it("toggles passage analysis with passage HTML and P1, P2 explanations", async () => {
    const user = userEvent.setup()
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          passage: {
            displayNumber: 1,
            title: "Passage 1",
            body: "<p>Passage paragraph one</p><p>Passage paragraph two</p>",
          },
          passageAnalysis: {
            paragraphs: [
              { label: "P1", explanationHtml: "<p>First paragraph analysis</p>" },
              { label: "P2", explanationHtml: "<p>Second paragraph analysis</p>" },
            ],
            overallHtml: "<p>Overall passage takeaway</p>",
          },
        }}
      />,
    )

    expect(screen.getByText("Passage paragraph one")).toBeInTheDocument()
    expect(screen.queryByText("First paragraph analysis")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /show analysis/i }))
    expect(screen.getByText("P1")).toBeInTheDocument()
    expect(screen.getByText("P2")).toBeInTheDocument()
    expect(screen.getByText("Passage paragraph one")).toBeInTheDocument()
    expect(screen.getByText("Passage paragraph two")).toBeInTheDocument()
    expect(screen.getByText("First paragraph analysis")).toBeInTheDocument()
    expect(screen.getByText("Second paragraph analysis")).toBeInTheDocument()
    expect(screen.getByText("Overall")).toBeInTheDocument()
    expect(screen.getByText("Overall passage takeaway")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /hide analysis/i }))
    expect(screen.queryByText("First paragraph analysis")).not.toBeInTheDocument()
    expect(screen.getByText("Passage paragraph one")).toBeInTheDocument()
  })
})
