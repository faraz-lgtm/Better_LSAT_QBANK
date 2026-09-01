import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { DrillQuestion } from "@/features/student/drills/drill-types"
import { PracticeBlindReviewQuestionPanel } from "@/features/student/practice-session/practice-blind-review-question-panel"

const question: DrillQuestion = {
  id: "q1",
  questionNumber: 1,
  stimulusText: null,
  stemText: "<p>Which of the following?</p>",
  choices: [
    { id: "a", index: 0, text: "<p>Choice A</p>" },
    { id: "b", index: 1, text: "<p>Choice B</p>" },
  ],
  passage: null,
}

describe("PracticeBlindReviewQuestionPanel", () => {
  it("renders the Blind Review stem at the Figma 18px size class", () => {
    render(
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={1}
        findQuery=""
        selectedIndex={null}
        revealed={false}
        isCorrect={null}
        submitting={false}
        allowReselect
        getRegionHtml={(_key, base) => base}
        onSelect={() => undefined}
        answerView="blind_review"
      />,
    )

    const stem = screen.getByText("Which of the following?").closest(".practice-session-br-stem")
    expect(stem).toBeTruthy()
    expect(stem).toHaveClass("practice-session-br-stem")
  })
  it("does not select a choice when viewing Actual during Blind Review", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={1}
        findQuery=""
        selectedIndex={0}
        revealed={false}
        isCorrect={null}
        submitting={false}
        allowReselect
        getRegionHtml={(_key, base) => base}
        onSelect={onSelect}
        answerView="actual"
        onAnswerViewChange={() => undefined}
        choicesDisabled
      />,
    )

    await user.click(screen.getByRole("button", { name: /choice a/i }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("lets Remove erase highlights on the stem", async () => {
    const onAnnotateClick = vi.fn()
    const user = userEvent.setup()

    render(
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={1}
        findQuery=""
        selectedIndex={null}
        revealed={false}
        isCorrect={null}
        submitting={false}
        allowReselect
        getRegionHtml={(_key, base) => base}
        onSelect={() => undefined}
        answerView="blind_review"
        onAnnotateMouseUp={() => undefined}
        onAnnotateClick={onAnnotateClick}
        annotateToolMode="eraser"
      />,
    )

    await user.click(screen.getByText("Which of the following?"))
    expect(onAnnotateClick).toHaveBeenCalled()
  })

  it("forwards stem mouseup so the official Highlight popover can open", () => {
    const onAnnotateMouseUp = vi.fn()

    render(
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={1}
        findQuery=""
        selectedIndex={null}
        revealed={false}
        isCorrect={null}
        submitting={false}
        allowReselect
        getRegionHtml={(_key, base) => base}
        onSelect={() => undefined}
        answerView="blind_review"
        onAnnotateMouseUp={onAnnotateMouseUp}
        onAnnotateClick={() => undefined}
      />,
    )

    const stem = screen.getByText("Which of the following?").closest(".practice-session-content")
    expect(stem).toHaveClass("select-text")
    fireEvent.mouseUp(stem!)
    expect(onAnnotateMouseUp).toHaveBeenCalled()
  })

  it("keeps Blind Review answer choices in a non-scrolling box", () => {
    render(
      <PracticeBlindReviewQuestionPanel
        question={question}
        questionNumber={1}
        findQuery=""
        selectedIndex={null}
        revealed={false}
        isCorrect={null}
        submitting={false}
        allowReselect
        getRegionHtml={(_key, base) => base}
        onSelect={() => undefined}
        answerView="blind_review"
      />,
    )

    const choice = screen.getByRole("button", { name: /choice a/i })
    const list = choice.closest(".practice-session-br-options")
    expect(list).toBeTruthy()
    expect(list).toHaveClass("overflow-hidden")
    expect(list).not.toHaveClass("overflow-y-auto")
    expect(choice).toHaveClass("py-3")
  })
})
