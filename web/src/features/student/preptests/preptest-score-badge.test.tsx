import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AttemptScoreBox } from "@/features/student/preptests/preptest-score-badge"

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
    expect(screen.getByText("139 BR")).toBeInTheDocument()
  })
})
