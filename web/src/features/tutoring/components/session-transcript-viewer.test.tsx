import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SessionTranscriptViewer } from "@/features/tutoring/components/session-transcript-viewer"
import type { SessionTranscript } from "@/features/tutoring/lib/types"

const transcript: SessionTranscript = {
  sessionId: "s1",
  title: "15-Minute Free Strategy Call",
  metaLabel: "Today",
  takeaways: ["Covered login troubleshooting."],
  currentTime: "00:43",
  totalTime: "00:40",
  segments: [
    { id: "topic-1", time: "00:10", label: "Screen Sharing Troubleshooting", kind: "topic" },
    { id: "actions-needed", time: "00:30", label: "Actions needed", kind: "action" },
  ],
  lines: [
    {
      id: "line-1",
      speaker: "tutor",
      name: "Sarah",
      initials: "SJ",
      time: "00:10",
      text: "Can you share your screen?",
    },
    {
      id: "line-2",
      speaker: "student",
      name: "Muhammad",
      initials: "MB",
      time: "00:30",
      text: "Yes, I will try again.",
    },
  ],
  recordingUrl: "https://example.com/recording.mp4",
}

function mockMediaElement() {
  const play = vi.fn().mockResolvedValue(undefined)
  const pause = vi.fn()
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: play,
  })
  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: pause,
  })
  Object.defineProperty(window.HTMLMediaElement.prototype, "paused", {
    configurable: true,
    get() {
      return (this as HTMLMediaElement & { _paused?: boolean })._paused !== false
    },
  })
  Object.defineProperty(window.HTMLMediaElement.prototype, "currentTime", {
    configurable: true,
    writable: true,
    value: 0,
  })
  Object.defineProperty(window.HTMLMediaElement.prototype, "duration", {
    configurable: true,
    writable: true,
    value: 40,
  })
  return { play, pause }
}

describe("SessionTranscriptViewer", () => {
  it("renders Actions needed time tag and seeks video on play/segment click", async () => {
    const user = userEvent.setup()
    const { play } = mockMediaElement()

    render(<SessionTranscriptViewer transcript={transcript} />)

    expect(
      screen.getByRole("button", { name: "Jump to Actions needed (00:30)" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Actions needed")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Play recording" }))
    expect(play).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Jump to Actions needed (00:30)" }))
    const video = document.querySelector("video")
    expect(video).toBeTruthy()
    expect((video as HTMLVideoElement).currentTime).toBe(30)
  })

  it("keeps the external progress clock in sync with native video playback", () => {
    mockMediaElement()
    render(<SessionTranscriptViewer transcript={transcript} />)

    expect(screen.getByText("00:00 / 00:40")).toBeInTheDocument()

    const video = document.querySelector("video") as HTMLVideoElement
    expect(video).toBeTruthy()

    act(() => {
      Object.defineProperty(video, "currentTime", { configurable: true, writable: true, value: 162 })
      Object.defineProperty(video, "duration", { configurable: true, writable: true, value: 1306 })
      fireEvent.loadedMetadata(video)
      fireEvent.play(video)
      fireEvent.timeUpdate(video)
    })

    expect(screen.getByText("02:42 / 21:46")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pause recording" })).toBeInTheDocument()
  })

  it("does not reset playback progress when transcript segments are a new array reference", () => {
    mockMediaElement()
    const { rerender } = render(<SessionTranscriptViewer transcript={transcript} />)
    const video = document.querySelector("video") as HTMLVideoElement

    act(() => {
      Object.defineProperty(video, "currentTime", { configurable: true, writable: true, value: 162 })
      Object.defineProperty(video, "duration", { configurable: true, writable: true, value: 1306 })
      fireEvent.loadedMetadata(video)
      fireEvent.play(video)
      fireEvent.timeUpdate(video)
    })
    expect(screen.getByText("02:42 / 21:46")).toBeInTheDocument()

    rerender(
      <SessionTranscriptViewer
        transcript={{
          ...transcript,
          segments: transcript.segments.map((segment) => ({ ...segment })),
        }}
      />,
    )

    expect(screen.getByText("02:42 / 21:46")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pause recording" })).toBeInTheDocument()
  })

  it("seeks the video when the external progress bar is clicked", async () => {
    const user = userEvent.setup()
    mockMediaElement()
    render(<SessionTranscriptViewer transcript={transcript} />)

    const video = document.querySelector("video") as HTMLVideoElement
    act(() => {
      Object.defineProperty(video, "duration", { configurable: true, writable: true, value: 40 })
      fireEvent.loadedMetadata(video)
    })

    const scrubber = screen.getByRole("slider", { name: "Seek recording" })
    scrubber.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 100,
        height: 26,
        top: 0,
        left: 0,
        bottom: 26,
        right: 100,
        toJSON: () => ({}),
      }) as DOMRect

    await user.pointer({ keys: "[MouseLeft]", target: scrubber, coords: { clientX: 50, clientY: 13 } })

    expect(video.currentTime).toBe(20)
    expect(screen.getByText("00:20 / 00:40")).toBeInTheDocument()
  })

  it("copies transcript text to the clipboard", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })

    render(<SessionTranscriptViewer transcript={transcript} />)

    await user.click(screen.getByRole("button", { name: "Copy" }))

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0]?.[0] as string
    expect(copied).toContain("15-Minute Free Strategy Call")
    expect(copied).toContain("[00:10] Sarah: Can you share your screen?")
    expect(copied).toContain("[00:30] Muhammad: Yes, I will try again.")
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument()
  })

  it("downloads transcript as a text file", async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn().mockReturnValue("blob:transcript")
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    render(<SessionTranscriptViewer transcript={transcript} />)

    await user.click(screen.getByRole("button", { name: "Download" }))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe("text/plain;charset=utf-8")
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:transcript")

    clickSpy.mockRestore()
  })
})
