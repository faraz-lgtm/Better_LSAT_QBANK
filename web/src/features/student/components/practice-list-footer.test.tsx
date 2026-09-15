import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PracticeListFooter } from "@/features/student/components/practice-list-footer"

describe("PracticeListFooter", () => {
  it("shows See more when the list can expand", async () => {
    const onShowMore = vi.fn()
    const user = userEvent.setup()
    render(<PracticeListFooter hasMore expanded={false} onShowMore={onShowMore} />)
    await user.click(screen.getByRole("button", { name: "See more" }))
    expect(onShowMore).toHaveBeenCalled()
    expect(screen.queryByText("No More")).not.toBeInTheDocument()
  })

  it("shows See less when expanded so the list can collapse", async () => {
    const onShowLess = vi.fn()
    const user = userEvent.setup()
    render(
      <PracticeListFooter
        hasMore={false}
        expanded
        onShowMore={() => undefined}
        onShowLess={onShowLess}
      />,
    )
    await user.click(screen.getByRole("button", { name: "See less" }))
    expect(onShowLess).toHaveBeenCalled()
    expect(screen.queryByText("No More")).not.toBeInTheDocument()
  })

  it("renders nothing when there is nothing to expand or collapse", () => {
    const { container } = render(
      <PracticeListFooter hasMore={false} expanded={false} onShowMore={() => undefined} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
