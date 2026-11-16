import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { PastSessionsPanel } from "@/features/tutoring/components/past-sessions-panel"
import type { PastSessionRow, SessionTranscript } from "@/features/tutoring/lib/types"

const sessions: PastSessionRow[] = [
  {
    id: "past-1",
    dateLabel: "Oct 29",
    tutorName: "Maya Chen",
    focus: "LR — Necessary Assumption",
    transcriptStatus: "ready",
    recordingStatus: "ready",
  },
  {
    id: "past-2",
    dateLabel: "Oct 22",
    tutorName: "Daniel Okafor",
    focus: "RC — Comparative Passages",
    transcriptStatus: "none",
    recordingStatus: "none",
  },
  {
    id: "past-3",
    dateLabel: "Oct 15",
    tutorName: "Maya Chen",
    focus: "Diagnostic Review",
    transcriptStatus: "processing",
    recordingStatus: "processing",
  },
]

const transcript: SessionTranscript = {
  sessionId: "past-1",
  title: "LR — Necessary Assumption",
  metaLabel: "Oct 29 · 58 min · with Maya Chen",
  takeaways: ["Use the negation test."],
  currentTime: "02:10",
  totalTime: "58:00",
  segments: [],
  lines: [
    {
      id: "line-1",
      speaker: "tutor",
      name: "Maya Chen",
      initials: "MC",
      time: "00:00",
      text: "Let's start with Necessary Assumption.",
    },
  ],
  recordingUrl: "https://example.com/recording.mp4",
}

describe("PastSessionsPanel", () => {
  it("shows recording/transcript when ready and hides when unavailable", async () => {
    const user = userEvent.setup()
    const onSelectSession = vi.fn()

    render(
      <MemoryRouter>
        <PastSessionsPanel
          sessions={sessions}
          transcript={transcript}
          onSelectSession={onSelectSession}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Viewing" })).toBeInTheDocument()
    expect(screen.getByText("Not available")).toBeInTheDocument()
    expect(screen.getByText("Processing…")).toBeInTheDocument()
    expect(screen.getByText("SESSION TRANSCRIPT")).toBeInTheDocument()
    expect(screen.getByText("Let's start with Necessary Assumption.")).toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute(
      "src",
      "https://example.com/recording.mp4",
    )

    await user.click(screen.getByRole("button", { name: "Viewing" }))
    expect(onSelectSession).toHaveBeenCalledWith("past-1")
  })

  it("shows zoom share fallback when in-app recording is missing", () => {
    const shareOnly: SessionTranscript = {
      ...transcript,
      lines: [],
      recordingUrl: null,
      zoomShareUrl: "https://zoom.example/share/abc",
    }

    render(
      <MemoryRouter>
        <PastSessionsPanel sessions={sessions} transcript={shareOnly} />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: "Open Zoom recording" })).toHaveAttribute(
      "href",
      "https://zoom.example/share/abc",
    )
    expect(document.querySelector("video")).toBeNull()
  })

  it("shows recording-only sessions", () => {
    const recordingOnly: SessionTranscript = {
      ...transcript,
      lines: [],
      recordingUrl: "https://example.com/only.mp4",
    }

    render(
      <MemoryRouter>
        <PastSessionsPanel
          sessions={[
            {
              id: "past-1",
              dateLabel: "Oct 29",
              tutorName: "Maya Chen",
              focus: "LR",
              transcriptStatus: "none",
              recordingStatus: "ready",
            },
          ]}
          transcript={recordingOnly}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole("button", { name: "Viewing" })).toBeInTheDocument()
    expect(document.querySelector("video")).toHaveAttribute("src", "https://example.com/only.mp4")
  })
})
