import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TestDayCountdownCard } from "@/features/dashboard/components/test-day-countdown-card"

const baseProps = {
  daysRemaining: 12,
  firstName: "Assad",
  testMeta: "LSAC · Oct 7–10, 2026",
  testDateLabel: "October 2026",
  testDateValue: "2026-10-07",
  onTestDateChange: vi.fn(),
  onStartAdaptiveDrill: vi.fn(),
}

describe("TestDayCountdownCard", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-21T12:00:00"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows remaining days before the selected administration", () => {
    render(<TestDayCountdownCard {...baseProps} />)
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("days")).toBeInTheDocument()
    expect(screen.queryByText("Current Test Administration In Progress")).not.toBeInTheDocument()
  })

  it("replaces 0 days with in-progress copy once the selected test date is reached", () => {
    render(
      <TestDayCountdownCard
        {...baseProps}
        daysRemaining={0}
        administrationInProgress
        testMeta="LSAC · Sep 9–12, 2026"
        testDateLabel="September 2026"
        testDateValue="2026-09-09"
      />,
    )
    expect(screen.getByText("Current Test Administration In Progress")).toBeInTheDocument()
    expect(screen.queryByText("0")).not.toBeInTheDocument()
    expect(screen.queryByText("days")).not.toBeInTheDocument()
  })

  it("hides passed administrations from the edit picker", () => {
    render(<TestDayCountdownCard {...baseProps} />)

    fireEvent.click(screen.getByRole("button", { name: "Choose test date" }))

    const options = screen.getAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual([
      "October 2026Test dates Oct 7–10, 2026",
      "November 2026Test dates Nov 11–14, 2026",
      "January 2027Test dates Jan 13–16, 2027",
      "February 2027Test dates Feb 12–13, 2027",
      "April 2027Test dates Apr 8–10, 2027",
      "June 2027Test dates Jun 9–12, 2027",
    ])
    expect(screen.queryByRole("option", { name: /September 2026/i })).not.toBeInTheDocument()
  })
})
