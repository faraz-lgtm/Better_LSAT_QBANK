import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FeedbackPage } from "@/features/feedback/pages/feedback-page"

const openFeedback = vi.fn()
const closeFeedback = vi.fn()
const restoreShell = vi.fn()
const keepInteractive = vi.fn(() => restoreShell)

vi.mock("@/lib/analytics/produktly", () => ({
  openProduktlyFeedback: (...args: unknown[]) => openFeedback(...args),
  closeProduktlyFeedback: (...args: unknown[]) => closeFeedback(...args),
  keepAppInteractiveDuringProduktlyFeedback: () => keepInteractive(),
}))

describe("FeedbackPage", () => {
  beforeEach(() => {
    openFeedback.mockReset()
    closeFeedback.mockReset()
    restoreShell.mockReset()
    keepInteractive.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("opens the Produktly feedback widget on mount and again on button click", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<FeedbackPage />)

    expect(openFeedback).toHaveBeenCalledWith(2722)
    expect(keepInteractive).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("heading", { name: "Share feedback" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Open feedback form" }))
    expect(openFeedback).toHaveBeenCalledTimes(2)

    unmount()
    expect(restoreShell).toHaveBeenCalledTimes(1)
    expect(closeFeedback).toHaveBeenCalledWith(2722)
  })
})
