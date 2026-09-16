import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AttemptScoreBox, PrepTestScoreText } from "@/features/student/preptests/preptest-score-badge"

describe("AttemptScoreBox", () => {
  it("renders single scaled score", () => {
    render(
      <AttemptScoreBox
        attempt={{
          sessionId: "s1",
          completedAt: "2026-01-01T00:00:00Z",
          scaledScore: 160,
          blindReviewScaledScore: null,
          attemptNumber: 1,
        }}
      />,
    )
    expect(screen.getByText("160")).toBeInTheDocument()
  })

  it("renders test score and BR score separately", () => {
    render(
      <AttemptScoreBox
        attempt={{
          sessionId: "s1",
          completedAt: "2026-01-01T00:00:00Z",
          scaledScore: 139,
          blindReviewScaledScore: 139,
          attemptNumber: 1,
        }}
      />,
    )
    expect(screen.getByText("139", { selector: "span.font-bold" })).toBeInTheDocument()
    expect(screen.getByText(/139 BR/)).toBeInTheDocument()
  })
})

describe("PrepTestScoreText", () => {
  it("renders header score and missing blind review as dashes", () => {
    render(<PrepTestScoreText variant="header" test={139} br={null} />)
    expect(screen.getByText("Score:")).toBeInTheDocument()
    expect(screen.getByText(/139/)).toBeInTheDocument()
    expect(screen.getByText("Blind Review:")).toBeInTheDocument()
    expect(screen.getByText(/---/)).toBeInTheDocument()
  })

  it("renders history score line with both values", () => {
    render(<PrepTestScoreText variant="history" test={139} br={139} />)
    expect(screen.getByText("Score: 139")).toBeInTheDocument()
    expect(screen.getByText("- Blind Review: 139")).toBeInTheDocument()
  })
})
