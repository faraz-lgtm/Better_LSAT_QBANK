import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ContinueDrillCard } from "@/features/student/components/continue-drill-card"

describe("ContinueDrillCard", () => {
  it("exposes Produktly tour targets on Continue and the difficulty chip", () => {
    render(
      <ContinueDrillCard
        drill={{
          id: "d1",
          section: "LR",
          title: "Assumption Family",
          progressPct: 40,
          questions: "4/10",
          timeLabel: "12m",
          lastAttempt: "Today",
          difficultyLabel: "Hardest",
          difficultyFilledBars: 5,
          difficultyColor: "#df1c41",
        }}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /Continue/i })).toHaveAttribute(
      "data-tour-target",
      "dashboard-continue-drill",
    )
    expect(screen.getByText("Hardest").closest("[data-tour-target]")).toHaveAttribute(
      "data-tour-target",
      "dashboard-drill-difficulty",
    )
  })
})
