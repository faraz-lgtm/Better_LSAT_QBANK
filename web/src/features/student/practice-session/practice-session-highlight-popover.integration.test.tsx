import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { PracticeAnnotatedContent } from "@/features/student/practice-session/practice-annotated-content"
import { PracticeSessionHighlightPopover } from "@/features/student/practice-session/practice-session-highlight-popover"
import { usePracticeHighlights } from "@/features/student/practice-session/use-practice-highlights"

function PassageHighlightHarness({ html = "<p>Hello world today</p>" }: { html?: string }) {
  const highlights = usePracticeHighlights()
  return (
    <div className="practice-session-card practice-session-card--active-drill">
      <PracticeAnnotatedContent
        regionKey="passage"
        html={html}
        onMouseUp={highlights.handleContentMouseUp}
        onClickCapture={highlights.handleContentClick}
      />
      <PracticeSessionHighlightPopover
        menu={highlights.selectionMenu}
        onApplyColor={highlights.applySelectionColor}
        onRemove={highlights.removeSelectionHighlight}
        onToggleExpanded={highlights.toggleSelectionExpanded}
        onDismiss={highlights.dismissSelectionMenu}
        isAnchorConnected={highlights.isSelectionMenuAnchorConnected}
      />
    </div>
  )
}

function firstTextNode(container: HTMLElement): Text {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const node = walker.nextNode()
  if (!(node instanceof Text)) throw new Error("expected a text node")
  return node
}

function selectOffsets(container: HTMLElement, start: number, end: number) {
  const text = firstTextNode(container)
  const range = document.createRange()
  range.setStart(text, start)
  range.setEnd(text, end)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

describe("passage selection highlighting", () => {
  it("shows the Highlight popover after selecting passage text", async () => {
    const { container } = render(<PassageHighlightHarness />)
    const passage = container.querySelector(".practice-session-content") as HTMLElement

    selectOffsets(passage, 0, 5)
    fireEvent.mouseUp(passage)

    expect(await screen.findByRole("toolbar", { name: "Highlight" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Highlight yellow" })).toBeInTheDocument()
  })

  it("places the Highlight popover at the mouse pointer", async () => {
    const { container } = render(<PassageHighlightHarness />)
    const passage = container.querySelector(".practice-session-content") as HTMLElement

    selectOffsets(passage, 0, 5)
    fireEvent.mouseUp(passage, { clientX: 480, clientY: 390 })

    await screen.findByRole("toolbar", { name: "Highlight" })
    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    expect(Number.parseFloat(root.style.left)).toBe(480)
    const top = Number.parseFloat(root.style.top)
    expect(top).toBeLessThan(390)
    expect(390 - top).toBeGreaterThanOrEqual(4)
    expect(390 - top).toBeLessThanOrEqual(96)
  })

  it("does not show the Highlight popover for a collapsed caret", () => {
    const { container } = render(<PassageHighlightHarness />)
    const passage = container.querySelector(".practice-session-content") as HTMLElement

    selectOffsets(passage, 1, 1)
    fireEvent.mouseUp(passage)

    expect(screen.queryByRole("toolbar", { name: "Highlight" })).not.toBeInTheDocument()
  })

  it("applies the chosen color to the selected text", async () => {
    const user = userEvent.setup()
    const { container } = render(<PassageHighlightHarness />)
    const passage = container.querySelector(".practice-session-content") as HTMLElement

    selectOffsets(passage, 0, 5)
    fireEvent.mouseUp(passage)

    await user.click(await screen.findByRole("button", { name: "Highlight blue" }))

    const mark = passage.querySelector("mark[data-highlight='blue']")
    expect(mark).not.toBeNull()
    expect(mark?.textContent).toBe("Hello")
    expect(screen.queryByRole("toolbar", { name: "Highlight" })).not.toBeInTheDocument()
  })

  it("shows Remove on an existing highlight and unwraps it", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PassageHighlightHarness html={'<p><mark data-highlight="yellow">Hello</mark> world today</p>'} />,
    )
    const passage = container.querySelector(".practice-session-content") as HTMLElement
    const mark = passage.querySelector("mark[data-highlight='yellow']") as HTMLElement

    window.getSelection()?.removeAllRanges()
    fireEvent.mouseUp(mark)

    await user.click(await screen.findByRole("button", { name: "Remove highlight" }))

    expect(passage.querySelector("mark[data-highlight]")).toBeNull()
    expect(passage.textContent).toContain("Hello world today")
  })

  it("places the Remove popover at the mouse pointer", async () => {
    const { container } = render(
      <PassageHighlightHarness html={'<p><mark data-highlight="green">Hello</mark> world today</p>'} />,
    )
    const mark = container.querySelector("mark[data-highlight='green']") as HTMLElement

    window.getSelection()?.removeAllRanges()
    fireEvent.mouseUp(mark, { clientX: 520, clientY: 310 })

    await screen.findByRole("button", { name: "Remove highlight" })
    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    expect(Number.parseFloat(root.style.left)).toBe(520)
    const top = Number.parseFloat(root.style.top)
    expect(top).toBeLessThan(310)
    expect(310 - top).toBeGreaterThanOrEqual(4)
    expect(310 - top).toBeLessThanOrEqual(48)
  })
})
