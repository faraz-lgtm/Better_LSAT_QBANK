import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { DrillTimingMenu } from "@/features/student/drills/drill-timing-menu"

function TimingHarness({
  initial = "unlimited",
  scaleFactor = 1,
  questionCount = 5,
}: {
  initial?: string
  scaleFactor?: number
  questionCount?: number
}) {
  const [value, setValue] = useState(initial)
  return (
    <DrillTimingMenu value={value} onChange={setValue} questionCount={questionCount} scaleFactor={scaleFactor} />
  )
}

describe("DrillTimingMenu", () => {
  it("lists Standard, Unlimited, Target, speed training, and accommodation options", async () => {
    const user = userEvent.setup()
    render(<TimingHarness />)

    await user.click(screen.getByRole("button", { name: "Timing" }))
    expect(screen.getByRole("option", { name: /Standard/ })).toHaveTextContent("07:00")
    expect(screen.getByRole("option", { name: /Unlimited/ })).toHaveTextContent("∞")
    expect(screen.getByRole("option", { name: /Target/ })).toHaveTextContent("07:22")
    expect(screen.getByRole("option", { name: "35 minutes" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Per question (1:20)" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /97%/ })).toHaveTextContent("06:47")
    expect(screen.getByRole("option", { name: /70%/ })).toHaveTextContent("04:54")
    expect(screen.getByText("SPEED TRAINING")).toBeInTheDocument()
    expect(screen.getByText("CUSTOM")).toBeInTheDocument()
  })

  it("selects Standard and shows it on the closed trigger", async () => {
    const user = userEvent.setup()
    render(<TimingHarness />)

    await user.click(screen.getByRole("button", { name: "Timing" }))
    await user.click(screen.getByRole("option", { name: /Standard/ }))
    expect(screen.getByRole("button", { name: "Timing" })).toHaveTextContent("Standard")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("keeps the menu open while adjusting custom percent", async () => {
    const user = userEvent.setup()
    render(<TimingHarness />)

    await user.click(screen.getByRole("button", { name: "Timing" }))
    await user.click(screen.getByRole("button", { name: "Increase 100 %" }))
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Timing" })).toHaveTextContent("101%")
  })

  it("scales 35 minutes and per-question labels for 1.5x accommodations", async () => {
    const user = userEvent.setup()
    render(<TimingHarness scaleFactor={1.5} />)

    await user.click(screen.getByRole("button", { name: "Timing" }))
    expect(screen.getByRole("option", { name: "53 minutes" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Per question (2:00)" })).toBeInTheDocument()
  })
})
