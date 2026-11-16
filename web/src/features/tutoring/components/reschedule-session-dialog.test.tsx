import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RescheduleSessionDialog } from "@/features/tutoring/components/reschedule-session-dialog"
import type { TutoringSessionSummary } from "@/features/tutoring/lib/types"

const listSlots = vi.fn()
const rescheduleBooking = vi.fn()

const session: TutoringSessionSummary = {
  id: "s1",
  month: "NOV",
  day: "5",
  title: "Logical Reasoning — Flaw & Assumption",
  whenLabel: "Thu, Nov 5 · 6:00 PM ET · 60 min",
  tutorName: "Maya Chen",
  tutorInitials: "MC",
  focus: "Logical Reasoning — Flaw & Assumption",
  action: "join",
  joinUrl: "https://zoom.example/join",
}

describe("RescheduleSessionDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date("2026-11-13T15:00:00.000Z"))
    listSlots.mockReset()
    rescheduleBooking.mockReset()
    listSlots.mockResolvedValue({
      data: {
        slots: {
          "2026-11-20": {
            "09:00": [[12, 1]],
            "14:30": [[12, 1]],
          },
        },
      },
    })
    rescheduleBooking.mockResolvedValue({ id: "s1" })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("loads slots, confirms a new time, and notifies parent", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onOpenChange = vi.fn()
    const onRescheduled = vi.fn().mockResolvedValue(undefined)
    const api = { listSlots, rescheduleBooking } as never

    render(
      <RescheduleSessionDialog
        open
        onOpenChange={onOpenChange}
        session={session}
        api={api}
        onRescheduled={onRescheduled}
      />,
    )

    expect(screen.getByRole("heading", { name: "Reschedule Session" })).toBeInTheDocument()
    expect(screen.getByText("Logical Reasoning — Flaw & Assumption")).toBeInTheDocument()
    expect(screen.getByText(/Currently/)).toBeInTheDocument()
    expect(screen.getByText("Keep Current Time")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Fri 20" })).toBeInTheDocument()
    })
    expect(listSlots).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: "Fri 20" }))
    await user.click(screen.getByRole("button", { name: "2:30 PM" }))
    await user.click(screen.getByRole("button", { name: "Confirm" }))

    await waitFor(() => {
      expect(rescheduleBooking).toHaveBeenCalledWith({
        sessionId: "s1",
        bookingStart: "2026-11-20 14:30",
        timeZone: "America/New_York",
      })
    })
    expect(onRescheduled).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows a text field when Other reason is selected", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const api = { listSlots, rescheduleBooking } as never

    render(
      <RescheduleSessionDialog
        open
        onOpenChange={vi.fn()}
        session={session}
        api={api}
        onRescheduled={vi.fn()}
      />,
    )

    expect(screen.queryByPlaceholderText("Tell us more…")).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Reason/), "other")
    expect(screen.getByPlaceholderText("Tell us more…")).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Tell us more…"), "Travel conflict")
    expect(screen.getByPlaceholderText("Tell us more…")).toHaveValue("Travel conflict")
  })

  it("navigates months and reloads slots", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const api = { listSlots, rescheduleBooking } as never
    listSlots
      .mockResolvedValueOnce({
        data: {
          slots: {
            "2026-11-20": { "09:00": [[12, 1]] },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          slots: {
            "2026-12-04": { "10:00": [[12, 1]] },
          },
        },
      })

    render(
      <RescheduleSessionDialog
        open
        onOpenChange={vi.fn()}
        session={session}
        api={api}
        onRescheduled={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText("November 2026")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Next month" }))

    await waitFor(() => {
      expect(screen.getByText("December 2026")).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Fri 4" })).toBeInTheDocument()
    })
    expect(listSlots).toHaveBeenCalledTimes(2)
    expect(listSlots).toHaveBeenLastCalledWith({
      startDateTime: "2026-12-01 00:00",
      endDateTime: "2026-12-31 23:59",
    })
  })
})
