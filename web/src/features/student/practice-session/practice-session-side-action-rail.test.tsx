import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { PracticeSessionSideWidget } from "@/features/student/practice-session/practice-session-side-action-rail"

describe("PracticeSessionSideWidget LSAT default view", () => {
  it("exposes review, accessibility, flag, masking, and expand/collapse", () => {
    render(
      <PracticeSessionSideWidget
        flagged={false}
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
        onReview={() => undefined}
        onAccessibility={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Accessibility" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Flag item" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Response Masking" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open Menu" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Underline" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open Menu" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-side-widget/download-circle-01.svg",
    )
  })

  it("expands to labeled tools and collapses back", async () => {
    const user = userEvent.setup()
    render(
      <PracticeSessionSideWidget
        flagged={false}
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Open Menu" }))
    expect(screen.getByRole("button", { name: "Collapse Menu" })).toBeInTheDocument()
    expect(screen.getByText("Review", { selector: "span" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Collapse Menu" }))
    expect(screen.getByRole("button", { name: "Open Menu" })).toBeInTheDocument()
  })
})

describe("PracticeSessionSideWidget official view", () => {
  it("exposes LawHub tools including keyboard highlight and collapse", () => {
    render(
      <PracticeSessionSideWidget
        variant="official"
        flagged={false}
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
        onReview={() => undefined}
        onAccessibility={() => undefined}
        onHighlighter={() => undefined}
        onLineFocus={() => undefined}
        onFullscreen={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Full Screen" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-official/arrows-pointing-out.svg",
    )
    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Keyboard Highlight" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open menu" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-side-widget/download-circle-01.svg",
    )
    expect(screen.queryByRole("button", { name: /^Highlighter$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Eraser" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Line focus" })).not.toBeInTheDocument()
  })

  it("expands to labeled tools with collapse pinned to the bottom", async () => {
    const user = userEvent.setup()
    render(
      <PracticeSessionSideWidget
        variant="official"
        flagged={false}
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
        onFullscreen={() => undefined}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Open menu" }))
    const rail = screen.getByRole("complementary", { name: "Exam tools" })
    expect(rail).toHaveClass("w-[174px]", "justify-between")
    expect(screen.getByRole("button", { name: "Collapse menu" })).toBeInTheDocument()
    expect(screen.getByText("Keyboard Highlight", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("Full Screen", { selector: "span" })).toBeInTheDocument()
    const buttons = screen.getAllByRole("button")
    expect(buttons.at(-1)).toHaveAccessibleName("Collapse menu")

    await user.click(screen.getByRole("button", { name: "Collapse menu" }))
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument()
  })

  it("uses the Figma arrows-in icon in official full view", () => {
    render(
      <PracticeSessionSideWidget
        variant="official"
        fullView
        flagged={false}
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
        onFullscreen={() => undefined}
      />,
    )

    expect(screen.getByRole("button", { name: "Normal view" }).querySelector("img")).toHaveAttribute(
      "src",
      "/figma/exam-official/arrows-pointing-in.svg",
    )
    expect(screen.queryByRole("button", { name: "Full screen" })).not.toBeInTheDocument()
  })

  it("fills the flag icon when the current question is flagged", () => {
    render(
      <PracticeSessionSideWidget
        variant="official"
        flagged
        onToggleFlag={() => undefined}
        responseMasking={false}
        onToggleResponseMasking={() => undefined}
        onFullscreen={() => undefined}
      />,
    )

    const flag = screen.getByRole("button", { name: "Flag item" })
    expect(flag).toHaveAttribute("aria-pressed", "true")
    expect(flag.querySelector("img")).toHaveAttribute("src", "/figma/exam-official/review-flag.svg")
  })
})
