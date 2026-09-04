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
        percentile={86.5}
        scoreHidden={false}
        onToggleScoreHidden={vi.fn()}
        showBlindReview
        onBlindReview={onBlindReview}
        onSkipDetails={onSkip}
        onDone={vi.fn()}
      />,
    )

    expect(screen.getByText("165")).toBeInTheDocument()
    expect(screen.getByText("10/20")).toBeInTheDocument()
    expect(screen.getByLabelText("86.5 percentile")).toBeInTheDocument()
    expect(screen.getByText("percentile")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Blind Review/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Skip to view details result/i })).toBeInTheDocument()
    expect(
      screen.getByText(/helps you identify reasoning errors before seeing your score/i),
    ).toBeInTheDocument()
  })

  it("falls back to accuracy percent when percentile is missing", () => {
    render(
      <PracticeCompleteModal
        open
        subtitle="You've completed the drill"
        rawScore={3}
        questionCount={5}
        scoreHidden={false}
        onToggleScoreHidden={vi.fn()}
        onDone={vi.fn()}
      />,
    )

    expect(screen.getByLabelText("60% percent")).toBeInTheDocument()
  })

  it("renders the Figma 20645:44601 title when provided", () => {
    render(
      <PracticeCompleteModal
        open
        title="Reading Comprehension Drill Done!"
        subtitle="You've completed the RC drill"
        rawScore={4}
        questionCount={5}
        scoreHidden
        onToggleScoreHidden={vi.fn()}
        showBlindReview
        onBlindReview={vi.fn()}
        onSkipDetails={vi.fn()}
        onDone={vi.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Reading Comprehension Drill Done!" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Peek at Score/i })).toBeInTheDocument()
  })
})
