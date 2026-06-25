import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  PracticePrepTestSectionTimeUpModal,
  buildPrepTestSectionTimeUpSummary,
} from "@/features/student/practice-session/practice-preptest-section-time-up-modal"

describe("PracticePrepTestSectionTimeUpModal", () => {
  const summary = buildPrepTestSectionTimeUpSummary({
    incorrectCount: 8,
  })

  it("renders the Time's Up prediction step", () => {
    render(
      <PracticePrepTestSectionTimeUpModal
        open
        step="predict"
        summary={summary}
        predictedScore={null}
        onPredictedScoreChange={vi.fn()}
        onSkip={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Time's Up!" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Predict your score")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument()
  })

  it("renders the Done summary step with prediction and continue", () => {
    render(
      <PracticePrepTestSectionTimeUpModal
        open
        step="done"
        summary={summary}
        predictedScore={159}
        onPredictedScoreChange={vi.fn()}
        onSkip={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Done!" })).toBeInTheDocument()
    expect(screen.getByText("159")).toBeInTheDocument()
    expect(screen.getByText("8 questions incorrect · About 8 in this section")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
  })

  it("calls skip and continue handlers", async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    const onContinue = vi.fn()

    const { rerender } = render(
      <PracticePrepTestSectionTimeUpModal
        open
        step="predict"
        summary={summary}
        predictedScore={null}
        onPredictedScoreChange={vi.fn()}
        onSkip={onSkip}
        onContinue={onContinue}
      />,
    )

    await user.click(screen.getByRole("button", { name: /Skip/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)

    rerender(
      <PracticePrepTestSectionTimeUpModal
        open
        step="done"
        summary={summary}
        predictedScore={159}
        onPredictedScoreChange={vi.fn()}
        onSkip={onSkip}
        onContinue={onContinue}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
