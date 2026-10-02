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

  it("renders the official LawHub Remove tooltip with highlighter, X, and pointer", async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()

    render(
      <PracticeSessionHighlightPopover
        variant="official"
        menu={{ mode: "remove", x: 200, y: 300, below: false }}
        onApplyColor={() => undefined}
        onRemove={onRemove}
        onToggleExpanded={() => undefined}
        onDismiss={() => undefined}
        isAnchorConnected={() => true}
      />,
    )

    const button = screen.getByRole("button", { name: "Remove highlight" })
    expect(button).toHaveTextContent("Remove")
    expect(button.querySelector("[data-official-remove-icon]")).toBeTruthy()
    expect(document.querySelector("[data-official-highlight-pointer]")).toBeInTheDocument()

    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    expect(Number.parseFloat(root.style.top)).toBe(300 - 56)
    expect(Number.parseFloat(root.style.left)).toBe(200)
    expect(root.style.transform).toBe("translateX(-50%)")

    await user.click(button)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it("uses LawHub official swatches: solid, spaced dash, tight dash, and dotted", () => {
    render(
      <PracticeSessionHighlightPopover
        variant="official"
        menu={{
          mode: "highlight",
          x: 200,
          y: 240,
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

    const stack = screen.getByRole("toolbar", { name: "Highlight" })
    expect(stack.className).toContain("w-[216px]")
    expect(stack.className).toContain("gap-2")
    expect(stack.className).not.toContain("border-[#d4d7e2]")

    const yellow = screen.getByRole("button", { name: "Highlight yellow" })
    expect(yellow).toHaveAttribute("data-official-swatch-style", "solid")
    expect(yellow.className).toContain("rounded-full")
    expect(yellow.className).toContain("size-6")
    expect(yellow.style.backgroundColor).toBe("rgb(255, 243, 176)")
    expect(yellow.querySelector("[data-official-swatch-ring]")?.getAttribute("stroke-dasharray")).toBeNull()

    const pink = screen.getByRole("button", { name: "Highlight pink" })
    expect(pink).toHaveAttribute("data-official-swatch-style", "dash-spaced")
    expect(pink.style.backgroundColor).toBe("rgb(248, 226, 226)")
    expect(pink.querySelector("[data-official-swatch-ring]")).toHaveAttribute("stroke-dasharray", "3.2 4.8")

    const green = screen.getByRole("button", { name: "Highlight green" })
    expect(green).toHaveAttribute("data-official-swatch-style", "dash-tight")
    expect(green.style.backgroundColor).toBe("rgb(197, 238, 214)")
    expect(green.querySelector("[data-official-swatch-ring]")).toHaveAttribute("stroke-dasharray", "1.5 1.2")

    const blue = screen.getByRole("button", { name: "Highlight blue" })
    expect(blue).toHaveAttribute("aria-pressed", "true")
    expect(blue).toHaveAttribute("data-official-swatch-style", "dotted")
    expect(blue.style.backgroundColor).toBe("rgb(197, 232, 248)")
    expect(blue.querySelector("[data-official-swatch-ring]")).toHaveAttribute("stroke-dasharray", "0.01 3.1")
    expect(blue.querySelector("[data-official-swatch-ring]")).toHaveAttribute("stroke-linecap", "round")
    expect(blue.querySelector("[data-official-check]")).toBeTruthy()
  })

  it("renders the official LawHub collapsed Highlight tooltip without swatches", () => {
    render(
      <PracticeSessionHighlightPopover
        variant="official"
        menu={{
          mode: "highlight",
          x: 200,
          y: 240,
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

    const header = screen.getByRole("button", { name: "Expand highlight colors" })
    expect(header.className).toContain("h-14")
    expect(header.className).toContain("px-5")
    expect(header.className).toContain("text-[16px]")
    expect(screen.getByText("Highlight")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Highlight yellow" })).not.toBeInTheDocument()
    expect(document.querySelector("[data-official-highlight-pointer]")).toBeInTheDocument()

    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    const top = Number.parseFloat(root.style.top)
    expect(top).toBe(240 - 56)
  })

  it("parks the official chip just above the first selected word", () => {
    render(
      <PracticeSessionHighlightPopover
        variant="official"
        menu={{
          mode: "highlight",
          x: 200,
          y: 300,
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

    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    expect(Number.parseFloat(root.style.top)).toBe(300 - 56)
    expect(Number.parseFloat(root.style.left)).toBe(200)
    expect(root.style.transform).toBe("translateX(-50%)")
  })

  it("converts official chip coordinates through html zoom", () => {
    const styleSpy = vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => (name === "--app-zoom" ? "0.75" : ""),
          zoom: "0.75",
        }) as CSSStyleDeclaration,
    )

    render(
      <PracticeSessionHighlightPopover
        variant="official"
        menu={{
          mode: "highlight",
          x: 300,
          y: 240,
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

    const root = document.querySelector("[data-passage-highlight-popover]") as HTMLElement
    expect(Number.parseFloat(root.style.left)).toBe(300 / 0.75)
    expect(Number.parseFloat(root.style.top)).toBe((240 - 56) / 0.75)
    styleSpy.mockRestore()
  })
})
