import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ComingSoonDialog } from "@/features/tutoring/components/coming-soon-dialog"

describe("ComingSoonDialog", () => {
  it("shows title and closes on Got it", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(<ComingSoonDialog open onOpenChange={onOpenChange} />)

    expect(screen.getByRole("heading", { name: "Coming Soon" })).toBeInTheDocument()
    expect(screen.getByText(/Rescheduling isn't available yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Got it" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
