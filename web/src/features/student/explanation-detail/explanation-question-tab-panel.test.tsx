import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ExplanationQuestionTabPanel } from "./explanation-question-tab-panel"

describe("ExplanationQuestionTabPanel", () => {
  it("renders HTML stem without visible tags", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
          questionStem: "<p>Which one of the following?</p>",
          questionExplanationHtml: null,
          questionNumber: 3,
          choices: [{ id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: null }],
          correctChoiceId: "A",
        }}
      />,
    )
    expect(screen.getByText("Which one of the following?")).toBeInTheDocument()
    expect(screen.getByText("Passage text")).toBeInTheDocument()
    expect(screen.getByText("Choice A")).toBeInTheDocument()
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument()
  })

  it("keeps question explanation collapsed by default when available", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
          questionStem: "<p>Which one of the following?</p>",
          questionExplanationHtml: "<p>Question-level explanation</p>",
          questionNumber: 3,
          choices: [{ id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: null }],
          correctChoiceId: "A",
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
          passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
          questionStem: "<p>Which one of the following?</p>",
          questionExplanationHtml: "<p>Question-level explanation</p>",
          questionNumber: 3,
          choices: [{ id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: null }],
          correctChoiceId: "A",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { expanded: false }))
    expect(screen.getByText("Question-level explanation")).toBeInTheDocument()
  })

  it("shows Show analysis label without revealing passage analysis", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
          questionStem: "<p>Which one of the following?</p>",
          questionExplanationHtml: null,
          questionNumber: 3,
          choices: [{ id: "A", index: 1, text: "<p>Choice A</p>", explanationHtml: null }],
          correctChoiceId: "A",
        }}
      />,
    )
    expect(screen.getByText("Show analysis")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /show analysis/i })).not.toBeInTheDocument()
  })
})
