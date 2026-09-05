import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeAnswerPopularityBars } from "@/features/student/practice-session/practice-results-ui"

describe("PracticeAnswerPopularityBars", () => {
  it("shows not enough answers yet below 5 unique responses", () => {
    render(
      <PracticeAnswerPopularityBars
        rows={[
          { letter: "A", count: 2, pct: 50 },
          { letter: "B", count: 2, pct: 50 },
        ]}
        correctLetter="A"
      />,
    )
    expect(screen.getByText("Not enough answers yet")).toBeInTheDocument()
    expect(screen.queryByText("A")).not.toBeInTheDocument()
  })

  it("renders bars at 5 unique responses", () => {
    render(
      <PracticeAnswerPopularityBars
        rows={[
          { letter: "A", count: 3, pct: 60, highlight: true },
          { letter: "B", count: 2, pct: 40 },
        ]}
        correctLetter="A"
      />,
    )
    expect(screen.queryByText("Not enough answers yet")).not.toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })
})
