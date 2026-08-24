import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionActiveDrillFooterNav } from "@/features/student/practice-session/practice-session-active-drill-footer-nav"

describe("PracticeSessionActiveDrillFooterNav", () => {
  const questions = [{ id: "q1" }, { id: "q2" }]

  it("shows submit control on the last question when onSubmit is provided", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <PracticeSessionActiveDrillFooterNav
        questions={questions}
        safeIndex={2}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
        onSubmit={onSubmit}
        submitLabel="Submit Test"
      />,
    )

    expect(screen.queryByRole("button", { name: "Next question" })).not.toBeInTheDocument()
    const submitButton = screen.getByRole("button", { name: "Submit Test" })
    await user.click(submitButton)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("keeps next control before the last question", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={questions}
        safeIndex={1}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
        onSubmit={() => undefined}
        submitLabel="Submit Test"
      />,
    )

    expect(screen.getByRole("button", { name: "Next question" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Submit Test" })).not.toBeInTheDocument()
  })

  it("renders passage separators between RC passage groups", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[
          { id: "q1", passage: { id: "p1" } },
          { id: "q2", passage: { id: "p1" } },
          { id: "q3", passage: { id: "p2" } },
          { id: "q4", passage: { id: "p2" } },
        ]}
        safeIndex={1}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    expect(document.querySelectorAll(".practice-session-question-nav-passage-break")).toHaveLength(1)
  })

  it("does not render passage separators when showPassageBreaks is false", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[
          { id: "q1", passage: { id: "lr-sec1" }, sourceGroupId: "g1" },
          { id: "q2", passage: { id: "lr-sec1" }, sourceGroupId: "g2" },
          { id: "q3", passage: { id: "lr-sec2" }, sourceGroupId: "g3" },
          { id: "q4", passage: { id: "lr-sec2" }, sourceGroupId: "g4" },
          { id: "q5", passage: { id: "lr-sec3" }, sourceGroupId: "g5" },
        ]}
        safeIndex={1}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="active-drill"
        showPassageBreaks={false}
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    expect(document.querySelectorAll(".practice-session-question-nav-passage-break")).toHaveLength(0)
  })

  it("colour-codes review outcomes on the question list", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[{ id: "q1" }, { id: "q2" }, { id: "q3" }]}
        safeIndex={1}
        answersByQuestion={{
          q1: { selectedAnswer: "A", isCorrect: true },
          q2: { selectedAnswer: "B", isCorrect: false },
        }}
        isFlagged={() => false}
        variant="active-drill"
        outcomeForQuestion={(id) => {
          if (id === "q1") return "correct"
          if (id === "q2") return "incorrect"
          return "unanswered"
        }}
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Question 1, correct" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Question 2, incorrect" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Question 3, unanswered" })).toBeInTheDocument()
    expect(document.querySelectorAll("[data-review-nav-outcome='correct']")).toHaveLength(1)
    expect(document.querySelectorAll("[data-review-nav-outcome='incorrect']")).toHaveLength(1)
    expect(document.querySelectorAll("[data-review-nav-outcome='unanswered']")).toHaveLength(1)
  })
})
