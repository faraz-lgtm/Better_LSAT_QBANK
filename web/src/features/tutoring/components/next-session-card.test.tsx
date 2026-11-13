import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { NextSessionCard } from "@/features/tutoring/components/next-session-card"
import type { TutoringSessionSummary } from "@/features/tutoring/lib/types"

const session: TutoringSessionSummary = {
  id: "upcoming-1",
  month: "NOV",
  day: "5",
  title: "Logical Reasoning — Flaw & Assumption",
  whenLabel: "Thu, Nov 5 · 6:00 PM ET · 60 min",
  tutorName: "Maya Chen",
  tutorInitials: "MC",
  focus: "Logical Reasoning — Flaw & Assumption",
  action: "join",
  joinUrl: "https://example.com/join",
}

describe("NextSessionCard", () => {
  it("renders booked session details and actions", async () => {
    const user = userEvent.setup()
    const onReschedule = vi.fn()
    const onJoin = vi.fn()

    render(<NextSessionCard session={session} onReschedule={onReschedule} onJoin={onJoin} />)

    expect(screen.getByText("NEXT SESSION")).toBeInTheDocument()
    expect(screen.getByText("Thu, Nov 5")).toBeInTheDocument()
    expect(screen.getByText(/6:00 PM ET · 60 min/)).toBeInTheDocument()
    expect(screen.getByText("Maya Chen")).toBeInTheDocument()
    expect(screen.getByText(/Focus: Logical Reasoning — Flaw & Assumption/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reschedule" }))
    expect(onReschedule).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "Join Session" }))
    expect(onJoin).toHaveBeenCalledTimes(1)
  })
})
