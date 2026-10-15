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

  it("toggles Passage Only View from the LSAT header like official", async () => {
    const user = userEvent.setup()
    const onPassageOnlyViewChange = vi.fn()

    const { rerender } = render(
      <PracticeSessionHeader
        variant="active-drill"
        title="Varied Mix"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerDisplaySeconds={60}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={1}
        finishButton={null}
        passageOnlyView={false}
        onPassageOnlyViewChange={onPassageOnlyViewChange}
      />,
    )

    const toggle = screen.getByRole("button", { name: "Passage Only View" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    await user.click(toggle)
    expect(onPassageOnlyViewChange).toHaveBeenCalledWith(true)

    rerender(
      <PracticeSessionHeader
        variant="active-drill"
        title="Varied Mix"
        findQuery=""
        onFindQueryChange={() => undefined}
        {...highlightHandlers}
        timerDisplaySeconds={60}
        timerPaused={false}
        onTimerPauseRequest={() => undefined}
        timerProgress={1}
        finishButton={null}
        passageOnlyView
        onPassageOnlyViewChange={onPassageOnlyViewChange}
      />,
    )

    expect(screen.getByRole("button", { name: "Passage Only View" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Passage Only View" })).toHaveClass(
      "border-[var(--primary)]",
      "bg-[var(--primary-25)]",
      "text-[var(--primary)]",
    )
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
    expect(screen.getAllByPlaceholderText("Find Text, Type Here").length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText("Time Left")).not.toBeInTheDocument()
    expect(screen.getAllByText("32:20").length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('img[src="/figma/exam-official/close.svg"]')).toBeInTheDocument()
    expect(container.querySelector('img[src="/figma/exam-official/search.svg"]')).toBeInTheDocument()
    const titles = screen.getAllByText("Test 123")
    expect(titles.length).toBeGreaterThanOrEqual(1)
    expect(titles.some((node) => node.className.includes("sm:text-[24px]"))).toBe(true)
    // Progress track stays in DOM for desktop, but is hidden on mobile chrome
    expect(container.querySelector('[aria-label="Exam progress"]')).toHaveClass("hidden", "md:block")
  })

  it("renders Figma mobile header chrome with title menu, tools trigger, and Passage/Question tabs", async () => {
    const user = userEvent.setup()
    const onOpenToolsMenu = vi.fn()
    const onMobilePaneChange = vi.fn()

    render(
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
        sectionLabel="Reading"
        onClose={() => undefined}
        onOpenToolsMenu={onOpenToolsMenu}
        showMobilePaneTabs
        mobilePane={null}
        onMobilePaneChange={onMobilePaneChange}
        finishButton={
          <PracticeSessionFinishMenu
            iconTrigger
            variant="official"
            onSubmitSection={() => undefined}
            onExit={() => undefined}
          />
        }
      />,
    )

    expect(screen.getAllByText("Test 123").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole("button", { name: "Open tools menu" })).toBeInTheDocument()
    expect(screen.getByText("Reading")).toBeInTheDocument()
    expect(screen.getByText("Question 1 of 26")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Pause section timer" }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole("button", { name: "More options" }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText("Find text")).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText("Find Text, Type Here").length).toBeGreaterThanOrEqual(1)
    // Passage / Question opens from the title chevron; both start unselected
    expect(screen.queryByRole("option", { name: "Passage" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Test 123 menu" }))
    const paneTabs = screen.getByRole("listbox", { name: "Reading view" })
    expect(paneTabs.className).toContain("bg-[var(--greyscale-25)]")
    expect(paneTabs.className).toContain("border-[var(--greyscale-100)]")
    expect(screen.getByRole("option", { name: "Passage" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("option", { name: "Question" })).toHaveAttribute("aria-selected", "false")
    await user.click(screen.getByRole("option", { name: "Question" }))
    expect(onMobilePaneChange).toHaveBeenCalledWith("question")
    expect(screen.queryByRole("option", { name: "Question" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Open tools menu" }))
    expect(onOpenToolsMenu).toHaveBeenCalledTimes(1)
  })

  it("toggles Passage / Question off when the active option is tapped again", async () => {
    const user = userEvent.setup()
    const onMobilePaneChange = vi.fn()

    render(
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
        sectionLabel="Reading"
        onClose={() => undefined}
        showMobilePaneTabs
        mobilePane="passage"
        onMobilePaneChange={onMobilePaneChange}
        finishButton={null}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Test 123 menu" }))
    expect(screen.getByRole("option", { name: "Passage" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("option", { name: "Passage" }))
    expect(onMobilePaneChange).toHaveBeenCalledWith(null)
  })
})
