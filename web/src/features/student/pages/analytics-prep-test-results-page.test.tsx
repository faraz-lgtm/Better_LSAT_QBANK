import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { AnalyticsPrepTestResultsPage } from "@/features/student/pages/analytics-prep-test-results-page"
import type { PrepTestSessionDetail } from "@/lib/api/analytics"

const { mockGetPrepTestSessionDetail, mockUpdateSession, analyticsApi, practiceApi } = vi.hoisted(() => {
  const mockGetPrepTestSessionDetail = vi.fn()
  const mockUpdateSession = vi.fn()
  return {
    mockGetPrepTestSessionDetail,
    mockUpdateSession,
    analyticsApi: { getPrepTestSessionDetail: mockGetPrepTestSessionDetail },
    practiceApi: { updateSession: mockUpdateSession },
  }
})

vi.mock("@/features/student/analytics/hooks/use-analytics-api", () => ({
  useAnalyticsApi: () => analyticsApi,
  usePracticeApi: () => practiceApi,
}))

vi.mock("@/lib/dev/prep-test-ui-preview", () => ({
  allowsPrepTestUnauthenticatedPreview: () => false,
}))

const sessionDetail: PrepTestSessionDetail = {
  sessionId: "d5f5db19-b84a-4ac4-be8b-640bc022cc20",
  prepTestId: "pt-156",
  prepTestTitle: "PrepTest 156",
  moduleId: "LSAC156",
  completedAt: "2026-06-19T12:00:00.000Z",
  startedAt: "2026-06-19T10:00:00.000Z",
  excluded: false,
  totalQuestions: 4,
  scaledScore: 120,
  blindReviewScore: 120,
  correct: 3,
  incorrect: 1,
  percentile: 0,
  blindReviewPercentile: 0,
  questions: [
    {
      id: "q1",
      number: 1,
      title: "Q1",
      tags: ["MB"],
      difficulty: "Hard",
      difficultyDots: 4,
      actualCorrect: true,
      blindReviewCorrect: true,
      correctLetter: "A",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
    },
    {
      id: "q2",
      number: 2,
      title: "Q2",
      tags: ["Strg"],
      difficulty: "Medium",
      difficultyDots: 3,
      actualCorrect: false,
      blindReviewCorrect: false,
      correctLetter: "B",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
    },
    {
      id: "q3",
      number: 1,
      title: "Q3",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      actualCorrect: true,
      blindReviewCorrect: true,
      correctLetter: "C",
      selectedLetter: "C",
      sectionType: "RC",
      sectionNumber: 2,
    },
    {
      id: "q4",
      number: 2,
      title: "Q4",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      actualCorrect: true,
      blindReviewCorrect: true,
      correctLetter: "D",
      selectedLetter: "D",
      sectionType: "RC",
      sectionNumber: 2,
    },
  ],
}

function renderResultsPage(sessionId = sessionDetail.sessionId) {
  const router = createMemoryRouter(
    [{ path: "/app/analytics/preptests/results/:testId", element: <AnalyticsPrepTestResultsPage /> }],
    { initialEntries: [`/app/analytics/preptests/results/${sessionId}`] },
  )
  render(<RouterProvider router={router} />)
}

describe("AnalyticsPrepTestResultsPage insights toggle", () => {
  beforeEach(() => {
    mockGetPrepTestSessionDetail.mockReset()
    mockUpdateSession.mockReset()
    mockGetPrepTestSessionDetail.mockResolvedValue(sessionDetail)
    mockUpdateSession.mockResolvedValue({ id: sessionDetail.sessionId, excluded: true })
  })

  it("turns exclude-from-insights on and keeps the results page visible", async () => {
    const user = userEvent.setup()
    renderResultsPage()

    await screen.findByRole("heading", { name: /PT156 - June 19, 2026/i })
    expect(screen.getByText("About this PrepTest")).toBeInTheDocument()
    expect(screen.getByText("YOUR SCORE")).toBeInTheDocument()

    const toggle = screen.getByRole("switch", { name: /exclude this preptest from insights/i })
    expect(toggle).not.toBeChecked()

    await user.click(toggle)

    await waitFor(() => {
      expect(toggle).toBeChecked()
    })
    expect(mockUpdateSession).toHaveBeenCalledWith({
      sessionId: sessionDetail.sessionId,
      excluded: true,
    })
    await screen.findByText("About this PrepTest")
    expect(screen.getByText("YOUR SCORE")).toBeInTheDocument()
    expect(screen.getByText("RESULTS BY SECTION")).toBeInTheDocument()
  })

  it("reverts toggle when updateSession fails", async () => {
    const user = userEvent.setup()
    mockUpdateSession.mockRejectedValueOnce(new Error("network"))
    renderResultsPage()

    const toggle = await screen.findByRole("switch", { name: /exclude this preptest from insights/i })
    await user.click(toggle)

    await waitFor(() => expect(mockUpdateSession).toHaveBeenCalled())
    await waitFor(() => expect(toggle).not.toBeChecked())
    await screen.findByText("About this PrepTest")
  })
})
