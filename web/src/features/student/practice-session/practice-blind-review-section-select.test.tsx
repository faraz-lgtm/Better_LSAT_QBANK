import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PracticeBlindReviewSectionSelect } from "@/features/student/practice-session/practice-blind-review-section-select"

const sections = [
  { sectionSessionId: "s1", label: "Section 1", sectionNumber: 1 },
  { sectionSessionId: "s2", label: "Section 2", sectionNumber: 2 },
  { sectionSessionId: "s3", label: "Section 3", sectionNumber: 3 },
]

describe("PracticeBlindReviewSectionSelect", () => {
  it("opens the menu directly under the trigger and lifts header overflow", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const { container } = render(
      <PracticeBlindReviewSectionSelect
        sections={sections}
        activeSectionSessionId="s1"
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole("button", { name: /Section 1/i }))

    const listbox = screen.getByRole("listbox")
    expect(container.contains(listbox)).toBe(true)
    expect(listbox.parentElement).not.toBe(document.body)
    expect(document.documentElement.classList.contains("practice-section-select-open")).toBe(true)
    expect(screen.getByRole("option", { name: "Section 2" })).toBeInTheDocument()
  })

  it("selects another section and closes the menu", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <PracticeBlindReviewSectionSelect
        sections={sections}
        activeSectionSessionId="s1"
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole("button", { name: /Section 1/i }))
    await user.click(screen.getByRole("option", { name: "Section 2" }))

    expect(onSelect).toHaveBeenCalledWith("s2")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(document.documentElement.classList.contains("practice-section-select-open")).toBe(false)
  })

  it("does not set the header open class when fullWidth (more panel)", async () => {
    const user = userEvent.setup()

    const { container } = render(
      <PracticeBlindReviewSectionSelect
        sections={sections}
        activeSectionSessionId="s1"
        onSelect={() => undefined}
        fullWidth
      />,
    )

    await user.click(screen.getByRole("button", { name: /Section 1/i }))

    expect(container.contains(screen.getByRole("listbox"))).toBe(true)
    expect(document.documentElement.classList.contains("practice-section-select-open")).toBe(false)
  })
})
