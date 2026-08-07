import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeBlindReviewAnswerToggle } from "@/features/student/practice-session/practice-blind-review-answer-toggle"

describe("PracticeBlindReviewAnswerToggle", () => {
  it("shows Actual and Blind Review in blind-review variant", () => {
    render(
      <PracticeBlindReviewAnswerToggle value="blind_review" onChange={() => undefined} />,
    )
    expect(screen.queryByRole("tab", { name: "Clean" })).toBeNull()
    expect(screen.getByRole("tab", { name: "Actual" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Blind Review" })).toBeInTheDocument()
  })

  it("shows Clean / Actual / Blind Review in review variant", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <PracticeBlindReviewAnswerToggle
        value="clean"
        onChange={onChange}
        variant="review"
        actualOutcome="correct"
        blindReviewOutcome="incorrect"
      />,
    )
    expect(screen.getByRole("tab", { name: "Clean" })).toBeInTheDocument()
    await user.click(screen.getByRole("tab", { name: "Actual" }))
    expect(onChange).toHaveBeenCalledWith("actual")
  })

  it("disables Blind Review tab when blindReviewEnabled is false", () => {
    render(
      <PracticeBlindReviewAnswerToggle
        value="clean"
        onChange={() => undefined}
        variant="review"
        blindReviewEnabled={false}
      />,
    )
    expect(screen.getByRole("tab", { name: "Blind Review" })).toBeDisabled()
    expect(screen.getByRole("tab", { name: "Clean" })).not.toBeDisabled()
    expect(screen.getByRole("tab", { name: "Actual" })).not.toBeDisabled()
  })
})
