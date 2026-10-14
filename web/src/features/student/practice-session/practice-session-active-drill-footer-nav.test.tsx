import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

  it("morphs next into submit on the last question", async () => {
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
    expect(submitButton).toBeEnabled()
    expect(submitButton).toHaveTextContent("Submit Test")
    expect(screen.getByRole("button", { name: "Previous question" })).not.toHaveTextContent("Prev")

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

  it("keeps next on the last question when disableNextAtLast is false", () => {
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
        disableNextAtLast={false}
        onSubmit={vi.fn()}
        submitLabel="Submit Drill"
      />,
    )

    expect(screen.getByRole("button", { name: "Next question" })).toBeEnabled()
    expect(screen.queryByRole("button", { name: "Submit Drill" })).not.toBeInTheDocument()
  })

  it("shows labeled submit on the last question in official layout", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <PracticeSessionActiveDrillFooterNav
        questions={questions}
        safeIndex={2}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="official"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
        onSubmit={onSubmit}
        submitLabel="Submit Section"
      />,
    )

    expect(screen.queryByRole("button", { name: "Next question" })).not.toBeInTheDocument()
    const submitButtons = screen.getAllByRole("button", { name: "Submit Section" })
    expect(submitButtons.some((button) => button.textContent === "Submit Section")).toBe(true)
    await user.click(submitButtons.find((button) => button.textContent === "Submit Section")!)
    expect(onSubmit).toHaveBeenCalledTimes(1)
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

  it("shows target time on question list hover when difficulty is present", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[
          { id: "q1", difficulty: 3 },
          { id: "q2", difficulty: 5 },
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

    expect(screen.getByRole("button", { name: /Question 1.*Target time: 01:30/ })).toHaveAttribute(
      "title",
      "Target time: 01:30",
    )
    expect(screen.getByRole("button", { name: /Question 2.*Target time: 01:45/ })).toHaveAttribute(
      "title",
      "Target time: 01:45",
    )
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
    const current = screen.getByRole("button", { name: "Question 2" })
    expect(current).toHaveClass(...ACTIVE_DRILL_QUESTION_NAV_BUTTON_ACTIVE_CLASS.split(" "))
    expect(current).not.toHaveClass("bg-[#0d47a1]")
    expect(current.querySelector('img[src="/figma/exam-official/current-caret.svg"]')).toBeInTheDocument()
    expect(current.querySelector("span[aria-hidden]")).toHaveClass("h-[3px]", "bg-[var(--primary)]")
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
    expect(current.querySelector('img[src="/figma/exam-official/current-caret.svg"]')).toBeInTheDocument()
  })

  it("marks the current question in the colour-coded review list", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[{ id: "q1" }, { id: "q2" }, { id: "q3" }]}
        safeIndex={2}
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

    const current = screen.getByRole("button", { name: "Question 2, incorrect" })
    expect(current).toHaveAttribute("aria-current", "true")
    expect(current).toHaveClass("bg-[#feeff2]", "border-[#df1c41]")
    expect(current).not.toHaveClass("bg-[var(--primary)]")
    expect(current.previousElementSibling).toHaveClass(
      "h-[10px]",
      "w-1",
      "bg-[var(--color-student-heading)]",
    )
    expect(screen.getByRole("button", { name: "Question 1, correct" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("button", { name: "Question 1, correct" })).toHaveClass("bg-[#effefa]")
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
    expect(flaggedTwo.parentElement?.querySelector('img[src="/figma/exam-review/flag.svg"]')).toBeInTheDocument()
    expect(flaggedThree.parentElement?.querySelector('img[src="/figma/exam-review/flag.svg"]')).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Question 1" }).parentElement?.querySelector('img[src="/figma/exam-review/flag.svg"]'),
    ).toBeNull()
  })

  it("uses Prev/Next labels, in-pill current caret, and 4px passage breaks in official layout", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[
          { id: "q1", passage: { id: "p1" } },
          { id: "q2", passage: { id: "p1" } },
          { id: "q3", passage: { id: "p2" } },
        ]}
        safeIndex={1}
        answersByQuestion={{ q2: { selectedAnswer: "A" } }}
        isFlagged={() => false}
        variant="official"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    const prev = screen.getAllByRole("button", { name: "Previous question" }).find((button) => button.textContent === "Prev")
    const next = screen.getAllByRole("button", { name: "Next question" }).find((button) => button.textContent === "Next")
    const current = screen.getByRole("button", { name: "Question 1" })
    const answered = screen.getByRole("button", { name: "Question 2" })

    expect(prev).toBeTruthy()
    expect(next).toBeTruthy()
    expect(prev).toHaveClass("h-7", "rounded-[6px]", "bg-[var(--primary)]", "px-3", "pt-[3px]", "pb-[5px]")
    expect(prev?.parentElement).toHaveClass("gap-2", "px-2")
    expect(current.closest(".practice-session-question-nav-grid")).toHaveClass("items-end", "gap-2")
    expect(current).toHaveClass("bg-[var(--primary-25)]", "text-[var(--color-student-heading)]")
    expect(current).not.toHaveClass("border-[var(--greyscale-100)]")
    expect(current.querySelector('img[src="/figma/exam-official/current-caret.svg"]')).toBeInTheDocument()
    expect(answered).toHaveClass("border-[var(--greyscale-100)]", "bg-[var(--greyscale-0)]")
    expect(answered.querySelector("span[aria-hidden]")).toHaveClass("h-[3px]", "bg-[var(--greyscale-300)]")
    expect(document.querySelector(".practice-session-question-nav-passage-break")).toHaveClass(
      "h-7",
      "w-[4px]",
      "bg-[var(--greyscale-500)]",
    )
  })

  it("renders Figma mobile official footer with Question N of M review trigger", async () => {
    const user = userEvent.setup()
    const onOpenReview = vi.fn()

    render(
      <PracticeSessionActiveDrillFooterNav
        questions={questions}
        safeIndex={1}
        answersByQuestion={{}}
        isFlagged={() => false}
        variant="official"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
        onOpenReview={onOpenReview}
      />,
    )

    const reviewTrigger = screen.getByRole("button", { name: "Question 1 of 2" })
    expect(reviewTrigger.querySelector('img[src="/figma/exam-official/mobile-footer-list.svg"]')).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Previous question" }).some((button) =>
      Boolean(button.querySelector('img[src="/figma/exam-official/mobile-footer-prev.svg"]')),
    )).toBe(true)
    expect(screen.getAllByRole("button", { name: "Next question" }).some((button) =>
      Boolean(button.querySelector('img[src="/figma/exam-official/mobile-footer-next.svg"]')),
    )).toBe(true)

    await user.click(reviewTrigger)
    expect(onOpenReview).toHaveBeenCalledTimes(1)
  })

  it("places the LawHub flag above flagged official question pills", () => {
    render(
      <PracticeSessionActiveDrillFooterNav
        questions={[
          { id: "q1", passage: { id: "p1" } },
          { id: "q2", passage: { id: "p1" } },
          { id: "q3", passage: { id: "p2" } },
        ]}
        safeIndex={1}
        answersByQuestion={{ q2: { selectedAnswer: "A" } }}
        isFlagged={(id) => id === "q2"}
        variant="official"
        onSelectQuestion={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
      />,
    )

    const flagged = screen.getByRole("button", { name: "Question 2, flagged" })
    const flag = flagged.parentElement?.querySelector('img[src="/figma/exam-official/review-flag.svg"]')
    expect(flag).toBeInTheDocument()
    expect(flag?.parentElement).toHaveClass("items-center", "justify-center")
    expect(flagged.parentElement).toHaveClass("items-center", "gap-0.5")
    expect(flagged.querySelector('img[src="/figma/exam-official/review-flag.svg"]')).toBeNull()
    expect(screen.getByRole("button", { name: "Question 1" }).parentElement?.querySelector('img[src="/figma/exam-official/review-flag.svg"]')).toBeNull()
  })
})
