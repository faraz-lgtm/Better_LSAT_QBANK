import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  matchesReviewFilters,
  PracticeSessionReviewPanel,
} from "@/features/student/practice-session/practice-session-review-panel"

describe("matchesReviewFilters", () => {
  const base = {
    questionNumber: 5,
    questionId: "q-5",
    currentIndex: 8,
    answered: false,
    flagged: false,
    filters: { flagged: false, unattempted: false, partiallyAttempted: false },
  }

  it("shows all questions when no filters are active", () => {
    expect(matchesReviewFilters(base)).toBe(true)
  })

  it("matches flagged questions", () => {
    expect(
      matchesReviewFilters({
        ...base,
        flagged: true,
        filters: { flagged: true, unattempted: false, partiallyAttempted: false },
      }),
    ).toBe(true)
  })

  it("matches unattempted questions", () => {
    expect(
      matchesReviewFilters({
        ...base,
        filters: { flagged: false, unattempted: true, partiallyAttempted: false },
      }),
    ).toBe(true)
  })

  it("matches partially attempted questions before the current index", () => {
    expect(
      matchesReviewFilters({
        ...base,
        filters: { flagged: false, unattempted: false, partiallyAttempted: true },
      }),
    ).toBe(true)
  })
})

describe("PracticeSessionReviewPanel Figma drawer", () => {
  const questions = [{ id: "q-1" }, { id: "q-2" }, { id: "q-3" }]

  it("renders the Review sheet with Figma filters, tiles, and collapse icon", () => {
    render(
      <PracticeSessionReviewPanel
        open
        questions={questions}
        currentIndex={2}
        answersByQuestion={{ "q-1": { choiceIndex: 0 } }}
        isFlagged={(id) => id === "q-2"}
        onSelectQuestion={() => undefined}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Flagged" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unattempted" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Partially Attempted" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close review" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-review/remove-rectangle.svg",
    )
    expect(screen.getByRole("button", { name: "Question 2, flagged" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-review/flag.svg",
    )
    expect(screen.getByRole("button", { name: "Question 2, flagged" })).toHaveAttribute("aria-current", "true")
  })

  it("selects a question and closes the drawer", async () => {
    const user = userEvent.setup()
    const onSelectQuestion = vi.fn()
    const onClose = vi.fn()

    render(
      <PracticeSessionReviewPanel
        open
        questions={questions}
        currentIndex={1}
        answersByQuestion={{}}
        isFlagged={() => false}
        onSelectQuestion={onSelectQuestion}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Question 3" }))
    expect(onSelectQuestion).toHaveBeenCalledWith(3)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
