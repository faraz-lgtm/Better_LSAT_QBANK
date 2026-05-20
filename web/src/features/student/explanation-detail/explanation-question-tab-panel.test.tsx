import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ExplanationQuestionTabPanel } from "./explanation-question-tab-panel"

describe("ExplanationQuestionTabPanel", () => {
  it("renders HTML stem without visible tags", () => {
    render(
      <ExplanationQuestionTabPanel
        view={{
          passage: { displayNumber: 1, title: "Passage 1", body: "<p>Passage text</p>" },
          questionStem: "<p>Which one of the following?</p>",
          choices: [{ id: "A", index: 1, text: "<p>Choice A</p>" }],
          correctChoiceId: "A",
        }}
      />,
    )
    expect(screen.getByText("Which one of the following?")).toBeInTheDocument()
    expect(screen.getByText("Passage text")).toBeInTheDocument()
    expect(screen.getByText("Choice A")).toBeInTheDocument()
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument()
  })
})
