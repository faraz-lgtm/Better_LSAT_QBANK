import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"

import { AdminStudentsFilterDropdown } from "./admin-students-filter-dropdown"

const OPTIONS = [
  { value: "all", label: "All plans", count: 80, dividerAfter: true },
  { value: "6 mo", label: "6 months", description: "Paid · 6-month access", count: 34 },
  { value: "free", label: "Free", description: "No paid plan yet", count: 25 },
]

function Harness() {
  const [value, setValue] = useState("all")
  return (
    <AdminStudentsFilterDropdown
      fieldLabel="PLAN"
      menuTitle="FILTER BY PLAN"
      value={value}
      onChange={setValue}
      options={OPTIONS}
      menuWidth={260}
    />
  )
}

describe("AdminStudentsFilterDropdown", () => {
  it("opens the Figma-style menu and selects an option", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByText("PLAN")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /All plans/i }))

    expect(screen.getByRole("listbox", { name: "FILTER BY PLAN" })).toBeInTheDocument()
    expect(screen.getByText("FILTER BY PLAN")).toBeInTheDocument()
    expect(screen.getByText("Paid · 6-month access")).toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: /6 months/i }))

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /6 months/i })).toBeInTheDocument()
  })
})
