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
  analytics: {
    questionStemTags: ["Weaken"] as string[],
  },
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

  it("uses equal two-column grid so answer choices share the page container width", () => {
    const { container } = render(<ExplanationQuestionTabPanel view={baseView} />)
    const grid = container.firstElementChild
    expect(grid?.className).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")
  })

  it("lets the page scroll instead of nesting overflow on the passage pane", () => {
    const { container } = render(<ExplanationQuestionTabPanel view={baseView} />)
    const grid = container.firstElementChild
    expect(grid?.className).not.toContain("h-full")
    expect(grid?.className).not.toContain("min-h-0")
    const passagePane = grid?.querySelector("article")
    expect(passagePane?.className).not.toContain("overflow-hidden")
    expect(passagePane?.firstElementChild?.className).not.toContain("overflow-y-auto")
  })

  it("shows Show explanation next to PASSAGE for LR (same spot as RC Reveal Passage Explanation)", () => {
    render(<ExplanationQuestionTabPanel view={baseView} />)
    expect(screen.getByRole("button", { name: "Show explanation" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /reveal passage explanation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show question explanation" })).not.toBeInTheDocument()
  })

  it("keeps LR explanation collapsed by default", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          questionExplanationHtml: "<p>Question-level explanation</p>",
        }}
      />,
    )

    expect(screen.queryByText("Question-level explanation")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Show explanation" })).toHaveAttribute(
      "aria-expanded",
      "false",
    )
  })

  it("expands LR question explanation under the passage like RC analysis", async () => {
    const user = userEvent.setup()
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          questionExplanationHtml: "<p>Question-level explanation</p>",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Show explanation" }))
    expect(screen.getByText("Passage text")).toBeInTheDocument()
    expect(screen.getByText("Question Type - Weaken")).toBeInTheDocument()
    expect(screen.getByText("Question-level explanation")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hide explanation" })).toBeInTheDocument()
  })

  it("shows empty state when LR has no written explanation yet", async () => {
    const user = userEvent.setup()
    render(<ExplanationQuestionTabPanel view={baseView} />)

    await user.click(screen.getByRole("button", { name: "Show explanation" }))
    expect(screen.getByText("No question explanation available yet.")).toBeInTheDocument()
  })

  it("hides Reveal Passage Explanation when no passage analysis (e.g. LR)", () => {
    render(<ExplanationQuestionTabPanel view={baseView} />)
    expect(screen.queryByText("Reveal Passage Explanation")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /reveal passage explanation/i })).not.toBeInTheDocument()
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
    expect(screen.queryByRole("button", { name: "Show explanation" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /reveal passage explanation/i }))
    expect(screen.getByText("P1")).toBeInTheDocument()
    expect(screen.getByText("P2")).toBeInTheDocument()
    expect(screen.getByText("Passage paragraph one")).toBeInTheDocument()
    expect(screen.getByText("Passage paragraph two")).toBeInTheDocument()
    expect(screen.getByText("First paragraph analysis")).toBeInTheDocument()
    expect(screen.getByText("Second paragraph analysis")).toBeInTheDocument()
    expect(screen.getByText("Overall")).toBeInTheDocument()
    expect(screen.getByText("Overall passage takeaway")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /hide passage explanation/i }))
    expect(screen.queryByText("First paragraph analysis")).not.toBeInTheDocument()
    expect(screen.getByText("Passage paragraph one")).toBeInTheDocument()
  })

  it("keeps RC question explanation on the stem chevron", async () => {
    const user = userEvent.setup()
    render(
      <ExplanationQuestionTabPanel
        view={{
          ...baseView,
          questionExplanationHtml: "<p>RC question write-up</p>",
          passageAnalysis: {
            paragraphs: [{ label: "P1", explanationHtml: "<p>Para analysis</p>" }],
            overallHtml: null,
          },
        }}
      />,
    )

    expect(screen.getByRole("button", { name: /reveal passage explanation/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show explanation" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show question explanation" }))
    expect(screen.getByText("RC question write-up")).toBeInTheDocument()
  })
})
