import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

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
})
