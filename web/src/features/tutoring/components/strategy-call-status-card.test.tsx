import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { StrategyCallStatusCard } from "@/features/tutoring/components/strategy-call-status-card"
import type { FreeStrategyCallDto } from "@/lib/api/tutoring"

const bookedSession: FreeStrategyCallDto = {
  id: "s1",
  status: "scheduled",
  isCompleted: false,
  tutorName: "Maya Chen",
  joinUrl: "https://zoom.example/join",
  startsAt: "2026-11-02T14:30:00.000Z",
  endsAt: "2026-11-02T14:45:00.000Z",
  timezone: "Asia/Karachi",
  dateLabel: "Mon, Nov 2, 2026",
  timeLabel: "7:30 PM · 15 min",
  timezoneLabel: "Asia/Karachi (GMT+5)",
  focus: "15-Minute Free Strategy Call",
  title: "15-Minute Free Strategy Call",
  transcriptStatus: "none",
  recordingStatus: "none",
  customerEmail: "masud.holt@example.com",
}

const completedSession: FreeStrategyCallDto = {
  ...bookedSession,
  status: "completed",
  isCompleted: true,
  joinUrl: null,
}

describe("StrategyCallStatusCard", () => {
  it("shows booked date/time details and Join/Reschedule actions", async () => {
    const user = userEvent.setup()
    const onReschedule = vi.fn()
    const onJoin = vi.fn()
    render(
      <StrategyCallStatusCard session={bookedSession} onReschedule={onReschedule} onJoin={onJoin} />,
    )

    expect(screen.getByText("✓ Call confirmed")).toBeInTheDocument()
    expect(screen.getByText("Your 1 free call")).toBeInTheDocument()
    expect(screen.getByText("Your free strategy call is booked.")).toBeInTheDocument()
    expect(screen.getByText(/masud\.holt@example\.com/)).toBeInTheDocument()
    expect(screen.getByText("Date")).toBeInTheDocument()
    expect(screen.getByText("Mon, Nov 2, 2026")).toBeInTheDocument()
    expect(screen.getByText("Time")).toBeInTheDocument()
    expect(screen.getByText("7:30 PM · 15 min")).toBeInTheDocument()
    expect(screen.queryByText("Status")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reschedule" }))
    await user.click(screen.getByRole("button", { name: "Join Session" }))
    expect(onReschedule).toHaveBeenCalled()
    expect(onJoin).toHaveBeenCalled()
  })

  it("shows completed status instead of Join/Reschedule", () => {
    render(<StrategyCallStatusCard session={completedSession} />)

    expect(screen.getByText("✓ Call completed")).toBeInTheDocument()
    expect(screen.getByText("Free call used")).toBeInTheDocument()
    expect(screen.getByText("You've already had your free strategy call.")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Join Session" })).not.toBeInTheDocument()
  })
})
