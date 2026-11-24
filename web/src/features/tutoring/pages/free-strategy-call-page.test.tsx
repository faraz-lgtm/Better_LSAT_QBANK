import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FreeStrategyCallPage } from "@/features/tutoring/pages/free-strategy-call-page"
import {
  BOOKING_PAGE_SRC,
  BOOKING_WIDGET_ID,
} from "@/features/tutoring/components/strategy-call-scheduler"

const listSessions = vi.fn()
const getTranscript = vi.fn()
const listSlots = vi.fn()
const rescheduleBooking = vi.fn()

vi.mock("@/features/student/components/student-main", () => ({
  StudentMain: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/tutoring", () => ({
  createTutoringApi: () => ({
    listSessions,
    getTranscript,
    listSlots,
    rescheduleBooking,
  }),
}))

const emptyList = {
  hasActivePackage: false,
  hasBookedFreeStrategyCall: false,
  freeStrategyCall: null,
  nextSession: null,
  upcomingSessions: [],
  pastSessions: [],
  activePackage: null,
}

describe("FreeStrategyCallPage", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    listSessions.mockReset()
    getTranscript.mockReset()
    listSlots.mockReset()
    rescheduleBooking.mockReset()
    listSessions.mockResolvedValue(emptyList)
    getTranscript.mockResolvedValue(null)
    listSlots.mockResolvedValue({ data: { slots: {} } })
  })

  it("shows a loading spinner until booking status resolves", async () => {
    let resolveList!: (value: typeof emptyList) => void
    listSessions.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve
      }),
    )

    render(<FreeStrategyCallPage />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading your strategy call…")
    expect(screen.queryByTitle("FREE LSAT Strategy Call booking")).not.toBeInTheDocument()

    resolveList(emptyList)

    await waitFor(() => {
      expect(screen.getByTitle("FREE LSAT Strategy Call booking")).toBeInTheDocument()
    })
    expect(screen.queryByText("Loading your strategy call…")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Loading booking calendar…")
  })

  it("renders Figma hero and always-on Amelia booking embed when not booked", async () => {
    render(<FreeStrategyCallPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Free 15-Minute Strategy Call" }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTitle("FREE LSAT Strategy Call booking")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: "Book your FREE Call with a 175+ Scorer" }),
    ).toBeInTheDocument()

    const iframe = screen.getByTitle("FREE LSAT Strategy Call booking")
    expect(iframe).toHaveAttribute("src", BOOKING_PAGE_SRC)
    expect(iframe).toHaveAttribute("id", BOOKING_WIDGET_ID)
    expect(screen.getByTestId("strategy-call-amelia-scheduler")).toBeInTheDocument()
    expect(screen.getByTestId("strategy-call-amelia-scheduler")).toHaveAttribute(
      "data-iframe-loaded",
      "false",
    )
    expect(screen.getByRole("status")).toHaveTextContent("Loading booking calendar…")
    expect(
      screen.getByRole("heading", { name: "What students say about BetterLSAT tutoring" }),
    ).toBeInTheDocument()

    fireEvent.load(iframe)
    await waitFor(() => {
      expect(screen.getByTestId("strategy-call-amelia-scheduler")).toHaveAttribute(
        "data-iframe-loaded",
        "true",
      )
    })
    expect(screen.queryByText("Loading booking calendar…")).not.toBeInTheDocument()
  })

  it("scrolls to the Amelia booking iframe from the hero CTA", async () => {
    const user = userEvent.setup()
    render(<FreeStrategyCallPage />)

    await waitFor(() => {
      expect(screen.getByTitle("FREE LSAT Strategy Call booking")).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Book your FREE Call with a 175+ Scorer" }))

    await vi.waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
  })

  it("shows booked status card with date/time when scheduled", async () => {
    listSessions.mockResolvedValue({
      ...emptyList,
      hasBookedFreeStrategyCall: true,
      freeStrategyCall: {
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
        customerEmail: "student@example.com",
      },
    })

    render(<FreeStrategyCallPage />)

    await waitFor(() => {
      expect(screen.getByTestId("strategy-call-status-card")).toHaveAttribute(
        "data-completed",
        "false",
      )
    })

    expect(screen.getByText("Your free strategy call is booked.")).toBeInTheDocument()
    expect(screen.getByText("Mon, Nov 2, 2026")).toBeInTheDocument()
    expect(screen.getByText("7:30 PM · 15 min")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Join Session" })).toBeInTheDocument()
    expect(screen.queryByTitle("FREE LSAT Strategy Call booking")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Book your FREE Call with a 175+ Scorer" }),
    ).not.toBeInTheDocument()
  })

  it("shows completed status and transcript when the call is finished", async () => {
    listSessions.mockResolvedValue({
      ...emptyList,
      hasBookedFreeStrategyCall: true,
      freeStrategyCall: {
        id: "s1",
        status: "completed",
        isCompleted: true,
        tutorName: "Maya Chen",
        joinUrl: null,
        startsAt: "2026-11-02T14:30:00.000Z",
        endsAt: "2026-11-02T14:45:00.000Z",
        timezone: "Asia/Karachi",
        dateLabel: "Mon, Nov 2, 2026",
        timeLabel: "7:30 PM · 15 min",
        timezoneLabel: "Asia/Karachi (GMT+5)",
        focus: "LR — Necessary Assumption",
        title: "LR — Necessary Assumption",
        transcriptStatus: "ready",
        recordingStatus: "ready",
        customerEmail: "student@example.com",
      },
    })
    getTranscript.mockResolvedValue({
      sessionId: "s1",
      title: "LR — Necessary Assumption",
      metaLabel: "Nov 2, 2026 · 15 min · with Maya Chen",
      takeaways: ["Use the negation test"],
      currentTime: "00:00",
      totalTime: "15:00",
      segments: [],
      lines: [
        {
          id: "l1",
          speaker: "tutor",
          time: "00:00",
          name: "Maya Chen",
          initials: "MC",
          text: "Let's start with necessary assumption.",
        },
      ],
      recordingUrl: null,
    })

    render(<FreeStrategyCallPage />)

    await waitFor(() => {
      expect(screen.getByTestId("strategy-call-status-card")).toHaveAttribute(
        "data-completed",
        "true",
      )
    })

    expect(screen.getByText("You've already had your free strategy call.")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Join Session" })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("LR — Necessary Assumption")).toBeInTheDocument()
    })
    expect(screen.getByText("Use the negation test")).toBeInTheDocument()
  })
})
