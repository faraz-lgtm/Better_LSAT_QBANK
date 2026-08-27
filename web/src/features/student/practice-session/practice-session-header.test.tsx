import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionFinishMenu } from "@/features/student/practice-session/practice-session-finish-menu"
import { PracticeSessionHeader } from "@/features/student/practice-session/practice-session-header"

const highlightHandlers = {
  activeColor: null,
  toolMode: "none" as const,
  fontScale: 1,
  lineSpacing: 1,
  boldEnabled: false,
  italicEnabled: false,
  onSelectColor: () => undefined,
  onEraser: () => undefined,
  onUnderline: () => undefined,
  onFontSize: () => undefined,
  onLineSpacing: () => undefined,
  onToggleBold: () => undefined,
  onToggleItalic: () => undefined,
}

describe("PracticeSessionHeader LSAT default view", () => {
  it("renders Figma header structure without the highlighter toolbar", () => {
    render(
      <PracticeSessionHeader
        variant="active-drill"
        title="LSAT Praxis Assessment"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerLabel="Time Left"
        timerDisplaySeconds={302}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={0.4}
        questionProgressLabel="1 of 26"
        questionNumber={1}
        questionCount={26}
        onClose={() => undefined}
        finishButton={<PracticeSessionFinishMenu iconTrigger onSubmitSection={() => undefined} onExit={() => undefined} />}
      />,
    )

    const close = screen.getByRole("button", { name: "Close exam" })
    const find = screen.getByPlaceholderText("Find Text, Type Here")
    expect(close.parentElement).toContainElement(find)
    expect(close.querySelector("img")).toHaveAttribute("src", "/figma/exam-header/block.svg")
    expect(screen.getByText("LSAT Praxis Assessment")).toHaveClass("text-[24px]")
    expect(screen.getByText("1 of 26")).toBeInTheDocument()
    expect(screen.getByText("Time Left")).toBeInTheDocument()
    expect(screen.getByText("05:02")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pause section timer" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-header/pause.svg",
    )
    expect(screen.getByRole("button", { name: "More options" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-header/dots-circle.svg",
    )
    expect(document.querySelector('img[src="/figma/exam-header/timer.svg"]')).toBeInTheDocument()
    expect(screen.queryByText("Tools:")).not.toBeInTheDocument()

    const progress = screen.getByRole("progressbar", { name: "Exam progress" })
    expect(progress).toHaveAttribute("aria-valuenow", "1")
    expect(progress).toHaveAttribute("aria-valuemax", "26")
    expect(progress.firstElementChild).toHaveStyle({ width: `${(1 / 26) * 100}%` })
  })

  it("fills the exam progress bar from the question label when counts are omitted", () => {
    render(
      <PracticeSessionHeader
        variant="active-drill"
        title="LSAT Praxis Assessment"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerDisplaySeconds={60}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={1}
        questionProgressLabel="13 of 26"
        onClose={() => undefined}
        finishButton={null}
      />,
    )

    const progress = screen.getByRole("progressbar", { name: "Exam progress" })
    expect(progress).toHaveAttribute("aria-valuenow", "13")
    expect(progress).toHaveAttribute("aria-valuemax", "26")
    expect(progress.firstElementChild).toHaveStyle({ width: "50%" })
  })

  it("calls onClose from the header close control", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <PracticeSessionHeader
        variant="active-drill"
        title="LSAT Praxis Assessment"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerDisplaySeconds={60}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={1}
        onClose={onClose}
        finishButton={null}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Close exam" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("PracticeSessionHeader official view", () => {
  it("renders LawHub chrome with Directions, Passage Only View, and title below the utility row", () => {
    const { container } = render(
      <PracticeSessionHeader
        variant="official"
        title="Test 123"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerDisplaySeconds={1940}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={0.1}
        questionProgressLabel="1 of 26"
        questionNumber={1}
        questionCount={26}
        onClose={() => undefined}
        finishButton={<PracticeSessionFinishMenu iconTrigger variant="official" onSubmitSection={() => undefined} onExit={() => undefined} />}
      />,
    )

    expect(screen.getByRole("button", { name: "Directions" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Passage Only View" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Find Text, Type Here")).toBeInTheDocument()
    expect(screen.queryByText("Time Left")).not.toBeInTheDocument()
    expect(screen.getByText("32:20")).toBeInTheDocument()
    expect(container.querySelector('img[src="/figma/exam-official/close.svg"]')).toBeInTheDocument()
    expect(container.querySelector('img[src="/figma/exam-official/search.svg"]')).toBeInTheDocument()
    const title = screen.getByText("Test 123")
    expect(title).toHaveClass("text-[24px]", "leading-8")
    expect(title.parentElement).toHaveClass("h-[56px]", "px-4")
    expect(title.compareDocumentPosition(screen.getByPlaceholderText("Find Text, Type Here")) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })
})
