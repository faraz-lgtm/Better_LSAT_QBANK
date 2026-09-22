import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeQuestionStem } from "./practice-question-stem"

describe("PracticeQuestionStem", () => {
  it("uses 18px / 1.5 / Apostrophe for official stem number and copy", () => {
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

    expect(screen.getByText("1 .")).toHaveClass("text-[18px]", "font-light", "leading-[1.5]")
    const stem = screen
      .getByText("Which one of the following most accurately states the main point of the passage?")
      .closest(".practice-session-content")
    expect(stem).toHaveClass("text-[18px]", "font-light", "leading-[1.5]")
    expect(stem?.className).toContain("[font-family:Apostrophe,halyard-text,sans-serif]")
    expect(stem).not.toHaveClass("leading-5")
  })
})
