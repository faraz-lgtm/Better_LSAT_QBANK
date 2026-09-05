import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeSessionHighlightPopover } from "@/features/student/practice-session/practice-session-highlight-popover"

describe("PracticeSessionHighlightPopover", () => {
  it("renders the expanded Highlight toolbar with four color swatches", () => {
    render(
      <PracticeSessionHighlightPopover
        menu={{
          mode: "highlight",
          x: 120,
          y: 80,
          below: false,
          expanded: true,
          selectedColor: "blue",
        }}
        onApplyColor={() => undefined}
        onRemove={() => undefined}
        onToggleExpanded={() => undefined}
        onDismiss={() => undefined}
        isAnchorConnected={() => true}
      />,
    )

    expect(screen.getByRole("toolbar", { name: "Highlight" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Highlight yellow" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Highlight pink" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Highlight green" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Highlight blue" })).toHaveAttribute("aria-pressed", "true")
  })

  it("renders a white card with even 20px swatches and sits just above the selection", () => {
    render(
      <PracticeSessionHighlightPopover
        menu={{
          mode: "highlight",
          x: 200,
          y: 240,
          below: false,
          expanded: true,
          selectedColor: "pink",
        }}
        onApplyColor={() => undefined}
        onRemove={() => undefined}
        onToggleExpanded={() => undefined}
        onDismiss={() => undefined}
        isAnchorConnected={() => true}
      />,
    )

    const card = screen.getByRole("toolbar", { name: "Highlight" })
    expect(card.className).toContain("bg-[var(--greyscale-0)]")
    expect(card.className).toContain("min-w-[168px]")
    expect(card.className).toContain("gap-2")

    const yellow = screen.getByRole("button", { name: "Highlight yellow" })
    expect(yellow.className).toContain("size-5")
    expect(screen.getByRole("button", { name: "Highlight pink" })).toHaveAttribute("aria-pressed", "true")

    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    const top = Number.parseFloat(root.style.top)
    expect(top).toBeLessThan(240)
    expect(240 - top).toBeGreaterThanOrEqual(2)
    expect(240 - top).toBeLessThanOrEqual(96)
  })

  it("hides swatches when collapsed", () => {
    render(
      <PracticeSessionHighlightPopover
        menu={{
          mode: "highlight",
          x: 120,
          y: 80,
          below: false,
          expanded: false,
          selectedColor: "yellow",
        }}
        onApplyColor={() => undefined}
        onRemove={() => undefined}
        onToggleExpanded={() => undefined}
        onDismiss={() => undefined}
        isAnchorConnected={() => true}
      />,
    )

    expect(screen.queryByRole("button", { name: "Highlight yellow" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand highlight colors" })).toBeInTheDocument()
  })

  it("renders the Remove control", async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <PracticeSessionHighlightPopover
        menu={{ mode: "remove", x: 120, y: 80, below: false }}
        onApplyColor={() => undefined}
        onRemove={onRemove}
        onToggleExpanded={() => undefined}
        onDismiss={() => undefined}
        isAnchorConnected={() => true}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Remove highlight" }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
