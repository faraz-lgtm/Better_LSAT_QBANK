import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"

import { FigmaDropdown } from "./figma-dropdown"

const OPTIONS = [
  { label: "Question", value: "Question" },
  { label: "Incorrect only", value: "Incorrect only" },
]

function Harness() {
  const [value, setValue] = useState("Question")
  return (
    <div className="flex justify-between">
      <span>Bookmarked only</span>
      <FigmaDropdown variant="pill" value={value} onChange={setValue} options={OPTIONS} />
    </div>
  )
}

describe("FigmaDropdown", () => {
  it("anchors the menu to the trigger and shows full option labels", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Question" }))

    const incorrect = screen.getByRole("option", { name: "Incorrect only" })
    expect(incorrect).toBeInTheDocument()
    expect(incorrect.className).not.toMatch(/truncate/)
    expect(incorrect.textContent).toBe("Incorrect only")

    const menu = screen.getByRole("listbox")
    expect(menu.className).toMatch(/absolute/)
    expect(menu.className).toMatch(/right-0/)
    expect(menu).not.toHaveStyle({ position: "fixed" })
  })

  it("selects an option and closes the menu", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole("button", { name: "Question" }))
    await user.click(screen.getByRole("option", { name: "Incorrect only" }))

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Incorrect only" })).toBeInTheDocument()
  })
})
