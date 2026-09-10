import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeAnswerPopularityBars } from "@/features/student/practice-session/practice-results-ui"

describe("PracticeAnswerPopularityBars", () => {
  it("always renders bars even below 5 unique responses", () => {
    render(
      <PracticeAnswerPopularityBars
        rows={[
          { letter: "A", count: 2, pct: 50 },
          { letter: "B", count: 2, pct: 50 },
        ]}
        correctLetter="A"
      />,
    )
    expect(screen.queryByText("Not enough answers yet")).not.toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getAllByText(/%$/).length).toBeGreaterThanOrEqual(2)
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
    expect(screen.getByText("60%")).toBeInTheDocument()
    expect(screen.getByText("40%")).toBeInTheDocument()
  })

  it("renders A–E provisional bars when rows are empty", () => {
    render(<PracticeAnswerPopularityBars rows={[]} correctLetter="C" />)
    expect(screen.queryByText("Not enough answers yet")).not.toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("C")).toBeInTheDocument()
    expect(screen.getByText("D")).toBeInTheDocument()
    expect(screen.getByText("E")).toBeInTheDocument()
  })
})
