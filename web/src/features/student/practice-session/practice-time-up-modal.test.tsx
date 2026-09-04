import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PracticeTimeUpModal } from "@/features/student/practice-session/practice-time-up-modal"

describe("PracticeTimeUpModal", () => {
  it("renders Figma 20645:70277 copy and calls onNext", async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()

    render(<PracticeTimeUpModal open onNext={onNext} />)

    expect(screen.getByRole("heading", { name: "Time's Up!" })).toBeInTheDocument()
    expect(
      screen.getByText("Your time is up! Please click next to see result data"),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("does not render when closed", () => {
    render(<PracticeTimeUpModal open={false} onNext={() => undefined} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
