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
