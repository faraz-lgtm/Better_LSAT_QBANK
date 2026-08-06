import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LrDrillOptionRow } from "./lr-drill-option-row"

describe("LrDrillOptionRow", () => {
  it("selects an answer while a passage selection leftover exists", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    const passage = document.createElement("div")
    passage.textContent = "passage text to highlight"
    document.body.appendChild(passage)
    const range = document.createRange()
    range.selectNodeContents(passage)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    expect(window.getSelection()?.isCollapsed).toBe(false)

    render(
      <LrDrillOptionRow
        index={0}
        html="<p>Choice A</p>"
        selected={false}
        onSelect={onSelect}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button"))
    expect(onSelect).toHaveBeenCalledTimes(1)

    document.body.removeChild(passage)
  })

  it("selects an answer on a simple click", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <LrDrillOptionRow
        index={1}
        html="<p>Choice B</p>"
        selected={false}
        onSelect={onSelect}
        variant="active-drill"
        showSideAction={false}
      />,
    )

    await user.click(screen.getByRole("button"))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
