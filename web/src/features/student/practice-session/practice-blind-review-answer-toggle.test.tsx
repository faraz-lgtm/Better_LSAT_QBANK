import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeBlindReviewAnswerToggle } from "@/features/student/practice-session/practice-blind-review-answer-toggle"

describe("PracticeBlindReviewAnswerToggle", () => {
  it("shows Actual and Blind Review tabs", () => {
    render(
      <PracticeBlindReviewAnswerToggle value="blind_review" onChange={() => undefined} />,
    )
    expect(screen.queryByRole("tab", { name: "Clean" })).toBeNull()
    expect(screen.getByRole("tab", { name: "Actual" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Blind Review" })).toBeInTheDocument()
  })

  it("calls onChange when switching to Actual", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <PracticeBlindReviewAnswerToggle value="blind_review" onChange={onChange} />,
    )
    await user.click(screen.getByRole("tab", { name: "Actual" }))
    expect(onChange).toHaveBeenCalledWith("actual")
  })
})
