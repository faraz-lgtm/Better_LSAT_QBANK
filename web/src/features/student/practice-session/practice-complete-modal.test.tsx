import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeCompleteModal } from "@/features/student/practice-session/practice-complete-modal"

describe("PracticeCompleteModal", () => {
  it("toggles peek and hide score", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <PracticeCompleteModal
        open
        subtitle="You've completed the drill"
        rawScore={3}
        questionCount={5}
        scoreHidden
        onToggleScoreHidden={onToggle}
        onDone={vi.fn()}
      />,
    )

    expect(screen.getByText("Your score is hidden")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Peek at Score/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("shows blind review actions when enabled", () => {
    const onBlindReview = vi.fn()
    const onSkip = vi.fn()

    render(
      <PracticeCompleteModal
        open
        subtitle="You've completed the prep test"
        rawScore={10}
        questionCount={20}
        scaledScore={165}
        scoreHidden={false}
        onToggleScoreHidden={vi.fn()}
        showBlindReview
        onBlindReview={onBlindReview}
        onSkipDetails={onSkip}
        onDone={vi.fn()}
      />,
    )

    expect(screen.getByText("Scaled score 165")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Blind Review/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Skip to view details result/i })).toBeInTheDocument()
  })
})
