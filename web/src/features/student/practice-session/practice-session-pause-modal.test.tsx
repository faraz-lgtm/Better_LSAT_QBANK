import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PracticeSessionPauseModal } from "@/features/student/practice-session/practice-session-pause-modal"

describe("PracticeSessionPauseModal", () => {
  it("renders and handles resume and save actions", async () => {
    const user = userEvent.setup()
    const onResume = vi.fn()
    const onSaveAndExit = vi.fn()

    render(
      <PracticeSessionPauseModal
        open
        onResume={onResume}
        onSaveAndExit={onSaveAndExit}
      />,
    )

    expect(screen.getByRole("heading", { name: "Section" })).toBeInTheDocument()
    expect(screen.getByText("Your section is paused")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Resume" }))
    await user.click(screen.getByRole("button", { name: "Save & Exit" }))

    expect(onResume).toHaveBeenCalledTimes(1)
    expect(onSaveAndExit).toHaveBeenCalledTimes(1)
  })
})
