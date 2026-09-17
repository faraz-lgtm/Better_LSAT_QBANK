import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeQuestionStem } from "./practice-question-stem"

describe("PracticeQuestionStem", () => {
  it("uses 15px / 30px / regular for official stem number and copy", () => {
    render(
      <PracticeQuestionStem
        questionNumber={1}
        regionKey="question"
        html="<p>Which one of the following most accurately states the main point of the passage?</p>"
        findQuery=""
        flagged={false}
        onToggleFlag={() => undefined}
        variant="official"
        showSideFlag={false}
      />,
    )

    expect(screen.getByText("1 .")).toHaveClass("text-[15px]", "font-normal", "leading-[30px]")
    const stem = screen
      .getByText("Which one of the following most accurately states the main point of the passage?")
      .closest(".practice-session-content")
    expect(stem).toHaveClass("text-[15px]", "font-normal", "leading-[30px]")
    expect(stem).not.toHaveClass("leading-5")
  })
})
