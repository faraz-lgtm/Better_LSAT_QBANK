import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ActiveDrillResultBar } from "@/features/prep-course/components/active-drill/active-drill-result-bar"
import type { PrepLessonActiveDrillAttempt } from "@/lib/api/prep-course"

const attempt: PrepLessonActiveDrillAttempt = {
  sessionId: "s1",
  completedAt: "2026-01-01T00:00:00Z",
  rawScore: 0,
  questionCount: 1,
  elapsedSeconds: 4,
  answers: [{ questionId: "q1", selectedAnswer: "E", isCorrect: false }],
  blindReview: null,
}

describe("ActiveDrillResultBar", () => {
  it("matches the Figma score card type and Retake control", () => {
    render(
      <ActiveDrillResultBar
        attempt={attempt}
        lessonTitle="Active Drill - Motivational Posters"
        questionOutcomes={[{ correct: false, unanswered: false }]}
        onRetake={() => {}}
      />,
    )

    expect(screen.getByRole("heading", { name: "Active Drill - Motivational Posters" })).toHaveClass("text-[20px]")
    expect(screen.getByText("Your Score")).toBeInTheDocument()
    expect(screen.getByText("0/1")).toHaveClass("text-[32px]")
    expect(screen.getByText("Correct")).toHaveClass("text-2xl")
    expect(screen.getByRole("img", { name: "Incorrect" })).toHaveClass("size-12")
    expect(screen.getByRole("img", { name: "Incorrect" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/active-drill/score-incorrect.svg",
    )

    const retake = screen.getByRole("button", { name: "Retake" })
    expect(retake).toHaveClass("h-10")
    expect(retake).toHaveClass("rounded-[14px]")
    expect(retake.querySelector("img")).toHaveAttribute("src", "/figma/active-drill/chevron-right.svg")
  })

  it("disables Retake while a new session is starting", () => {
    render(
      <ActiveDrillResultBar attempt={attempt} onRetake={vi.fn()} retaking />,
    )
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled()
  })
})
