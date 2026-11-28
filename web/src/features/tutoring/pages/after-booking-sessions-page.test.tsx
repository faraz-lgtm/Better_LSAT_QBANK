import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AfterBookingSessionsPage } from "@/features/tutoring/pages/after-booking-sessions-page"

const listSessions = vi.fn()
const getTranscript = vi.fn()
const listTodos = vi.fn()
const createTodo = vi.fn()
const updateTodo = vi.fn()
const listSlots = vi.fn()
const rescheduleBooking = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/tutoring", () => ({
  createTutoringApi: () => ({
    listSessions,
    getTranscript,
    listTodos,
    createTodo,
    updateTodo,
    listSlots,
    rescheduleBooking,
  }),
}))

describe("AfterBookingSessionsPage", () => {
  beforeEach(() => {
    listSessions.mockReset()
    getTranscript.mockReset()
    listTodos.mockReset()
    createTodo.mockReset()
    updateTodo.mockReset()
    listSlots.mockReset()
    rescheduleBooking.mockReset()
    getTranscript.mockResolvedValue(null)
    listTodos.mockResolvedValue({ sessionId: "s1", todos: [] })
    listSlots.mockResolvedValue({
      data: {
        slots: {
          "2026-11-20": {
            "09:00": [[12, 1]],
          },
        },
      },
    })
    rescheduleBooking.mockResolvedValue({ id: "s1" })
  })

  it("shows next booked session and opens reschedule dialog", async () => {
    const user = userEvent.setup()
    listSessions.mockResolvedValue({
      hasActivePackage: true,
      hasBookedFreeStrategyCall: true,
      freeStrategyCall: null,
      nextSession: {
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
        startsAt: "2026-11-05T23:00:00.000Z",
        endsAt: null,
        status: "scheduled",
        recordingStatus: "none",
        transcriptStatus: "none",
        dateLabel: "Nov 5",
      },
      upcomingSessions: [],
      pastSessions: [],
      activePackage: {
        name: "5-Session Pack",
        purchasedLabel: "Purchased Oct 29, 2026 · Never expires",
        slots: ["completed", "scheduled", "scheduled", "scheduled", "unscheduled"],
        completed: 1,
        scheduled: 3,
        notScheduled: 1,
      },
    })

    render(
      <MemoryRouter>
        <AfterBookingSessionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("NEXT SESSION")).toBeInTheDocument()
    })
    expect(screen.getByText("Thu, Nov 5")).toBeInTheDocument()
    expect(screen.getByText("Maya Chen")).toBeInTheDocument()
    expect(screen.getByText("YOUR PACKAGE")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "5-Session Pack" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "What students say about BetterLSAT tutoring" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reschedule" }))
    expect(screen.getByRole("heading", { name: "Reschedule Session" })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText("Pick a new day")).toBeInTheDocument()
    })
  })

  it("shows Book a session when no upcoming session and free strategy call unused", async () => {
    listSessions.mockResolvedValue({
      hasActivePackage: false,
      hasBookedFreeStrategyCall: false,
      freeStrategyCall: null,
      nextSession: null,
      upcomingSessions: [],
      pastSessions: [],
      activePackage: null,
    })

    render(
      <MemoryRouter>
        <AfterBookingSessionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("No upcoming session scheduled.")).toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: "Book a session" })).toHaveAttribute(
      "href",
      "/app/free-strategy-call",
    )
  })

  it("hides Book a session after free strategy call is already booked or completed", async () => {
    listSessions.mockResolvedValue({
      hasActivePackage: false,
      hasBookedFreeStrategyCall: true,
      freeStrategyCall: {
        id: "fsc-1",
        status: "completed",
        isCompleted: true,
        tutorName: "Mustafa Siddiqui",
        joinUrl: null,
        startsAt: "2026-11-28T10:15:00.000Z",
        endsAt: "2026-11-28T10:30:00.000Z",
        timezone: "America/New_York",
        dateLabel: "Sat, Nov 28",
        timeLabel: "3:15 PM",
        timezoneLabel: "ET",
        focus: "15-Minute Free Strategy Call",
        title: "15-Minute Free Strategy Call",
        transcriptStatus: "ready",
        recordingStatus: "ready",
        customerEmail: "student@example.com",
      },
      nextSession: null,
      upcomingSessions: [],
      pastSessions: [
        {
          id: "fsc-1",
          dateLabel: "Nov 28",
          tutorName: "Mustafa Siddiqui",
          focus: "15-Minute Free Strategy Call",
          transcriptStatus: "ready",
          recordingStatus: "ready",
        },
      ],
      activePackage: null,
    })

    render(
      <MemoryRouter>
        <AfterBookingSessionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("No upcoming session scheduled.")).toBeInTheDocument()
    })
    expect(screen.queryByRole("link", { name: "Book a session" })).not.toBeInTheDocument()
  })
})
