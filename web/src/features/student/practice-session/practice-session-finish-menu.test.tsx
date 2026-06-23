import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"

describe("PracticeSessionFinishMenu", () => {
  it("opens submit and exit options when Finish is clicked", async () => {
    const user = userEvent.setup()
    const onSubmitSection = vi.fn()
    const onExit = vi.fn()

    render(
      <PracticeSessionFinishMenu onSubmitSection={onSubmitSection} onExit={onExit} />,
    )

    expect(screen.queryByRole("menuitem", { name: "Submit Section" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /finish/i }))

    expect(screen.getByRole("menuitem", { name: "Submit Section" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Exit\s*\(Saved Progress\)/i })).toBeInTheDocument()
  })
})
