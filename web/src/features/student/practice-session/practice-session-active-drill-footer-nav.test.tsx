import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionActiveDrillFooterNav } from "@/features/student/practice-session/practice-session-active-drill-footer-nav"
import {
  ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS,
  ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS,
} from "@/features/student/practice-session/practice-session-active-drill-styles"

describe("PracticeSessionActiveDrillFooterNav", () => {
  const questions = [{ id: "q1" }, { id: "q2" }]

  it("keeps icon-only next on the last question; submit lives in the header menu", () => {
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
        onSubmit={vi.fn()}
        submitLabel="Submit Test"
      />,
    )

    const nextButton = screen.getByRole("button", { name: "Next question" })
    expect(nextButton).toBeDisabled()
    expect(nextButton).not.toHaveTextContent("Next")
    expect(screen.queryByRole("button", { name: "Submit Test" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Previous question" })).not.toHaveTextContent("Prev")
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

  it("left-aligns the prev / pills / next cluster", () => {
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
      />,
    )

    const cluster = screen.getByRole("button", { name: "Previous question" }).parentElement?.parentElement
    expect(cluster).toHaveClass(...ACTIVE_DRILL_FOOTER_NAV_CLUSTER_CLASS.split(" "))
    expect(cluster?.className.split(" ")).not.toContain("justify-center")
  })

  it("uses light-blue current and solid-blue answered pills", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[{ id: "q1" }, { id: "q2" }, { id: "q3" }]}
        safeIndex={2}
        answersByQuestion={{ q1: { selectedAnswer: "A" } }}
        isFlagged={() => false}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Question 1" })).toHaveClass(
      ...ACTIVE_DRILL_QUESTION_NAV_BUTTON_ANSWERED_CLASS.split(" "),
    )
    expect(screen.getByRole("button", { name: "Question 2" })).toHaveClass(
      ...ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS.split(" "),
    )
    expect(screen.getByRole("button", { name: "Question 2" })).not.toHaveClass("bg-[#0d47a1]")
    expect(screen.getByRole("button", { name: "Question 3" })).toHaveClass(
      ...ACTIVE_DRILL_QUESTION_NAV_BUTTON_DEFAULT_CLASS.split(" "),
    )
  })

  it("keeps the current pill light-blue even when that question is answered", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[{ id: "q1" }, { id: "q2" }]}
        safeIndex={1}
        answersByQuestion={{ q1: { selectedAnswer: "A" } }}
        isFlagged={() => false}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    const current = screen.getByRole("button", { name: "Question 1" })
    expect(current).toHaveClass(...ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS.split(" "))
    expect(current).not.toHaveClass("bg-[#0d47a1]")
  })

  it("places the Figma flag above flagged question pills", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[{ id: "q1" }, { id: "q2" }, { id: "q3" }]}
        safeIndex={1}
        answersByQuestion={{}}
        isFlagged={(id) => id === "q2" || id === "q3"}
        variant="active-drill"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    const flaggedTwo = screen.getByRole("button", { name: "Question 2, flagged" })
    const flaggedThree = screen.getByRole("button", { name: "Question 3, flagged" })
    expect(flaggedTwo.parentElement?.querySelector("img")).toHaveAttribute("src", "/figma/exam-review/flag.svg")
    expect(flaggedThree.parentElement?.querySelector("img")).toHaveAttribute("src", "/figma/exam-review/flag.svg")
    expect(screen.getByRole("button", { name: "Question 1" }).parentElement?.querySelector("img")).toBeNull()
  })
})
