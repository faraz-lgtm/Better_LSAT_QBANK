import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { AnalyticsPrepTestResultsPage } from "@/features/student/pages/analytics-prep-test-results-page"
import type { PrepTestSessionDetail } from "@/lib/api/analytics"

const {
  mockGetPrepTestSessionDetail,
  mockUpdateSession,
  mockListQuestionBookmarks,
  mockSetQuestionBookmark,
  analyticsApi,
  practiceApi,
} = vi.hoisted(() => {
  const mockGetPrepTestSessionDetail = vi.fn()
  const mockUpdateSession = vi.fn()
  const mockListQuestionBookmarks = vi.fn()
  const mockSetQuestionBookmark = vi.fn()
  return {
    mockGetPrepTestSessionDetail,
    mockUpdateSession,
    mockListQuestionBookmarks,
    mockSetQuestionBookmark,
    analyticsApi: { getPrepTestSessionDetail: mockGetPrepTestSessionDetail },
    practiceApi: { updateSession: mockUpdateSession },
  }
})

vi.mock("@/features/student/analytics/hooks/use-analytics-api", () => ({
  useAnalyticsApi: () => analyticsApi,
  usePracticeApi: () => practiceApi,
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/explanations", () => ({
  createExplanationsApi: () => ({
    listQuestionBookmarks: mockListQuestionBookmarks,
    setQuestionBookmark: mockSetQuestionBookmark,
  }),
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
  blindReviewCompletedAt: "2026-06-20T12:00:00.000Z",
  questions: [
    {
      id: "q1",
      number: 1,
      title: "Q1",
      tags: ["MB"],
      difficulty: "Hard",
      difficultyDots: 4,
      targetTimeSeconds: 105,
      yourTimeSeconds: 80,
      actualCorrect: true,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "A",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
      isExperimental: false,
    },
    {
      id: "q2",
      number: 2,
      title: "Q2",
      tags: ["Strg"],
      difficulty: "Medium",
      difficultyDots: 3,
      targetTimeSeconds: 90,
      actualCorrect: false,
      blindReviewCorrect: false,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "B",
      selectedLetter: "A",
      sectionType: "LR",
      sectionNumber: 1,
      isExperimental: false,
    },
    {
      id: "q3",
      number: 1,
      title: "Q3",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      targetTimeSeconds: 75,
      actualCorrect: true,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "C",
      selectedLetter: "C",
      sectionType: "RC",
      sectionNumber: 2,
      isExperimental: false,
    },
    {
      id: "q4",
      number: 2,
      title: "Q4",
      tags: ["RC"],
      difficulty: "Easy",
      difficultyDots: 2,
      targetTimeSeconds: 75,
      actualCorrect: true,
      blindReviewCorrect: true,
      blindReviewUnanswered: false,
      isUnanswered: false,
      correctLetter: "D",
      selectedLetter: "D",
      sectionType: "RC",
      sectionNumber: 2,
      isExperimental: false,
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
    window.localStorage.clear()
    mockGetPrepTestSessionDetail.mockReset()
    mockUpdateSession.mockReset()
    mockListQuestionBookmarks.mockReset()
    mockSetQuestionBookmark.mockReset()
    mockGetPrepTestSessionDetail.mockResolvedValue(sessionDetail)
    mockUpdateSession.mockResolvedValue({ id: sessionDetail.sessionId, excluded: true })
    mockListQuestionBookmarks.mockResolvedValue({ questionIds: [] })
    mockSetQuestionBookmark.mockResolvedValue({ questionIds: ["q1"] })
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

  it("links the edit pencil to the explanation detail page for that question", async () => {
    renderResultsPage()
    await screen.findByRole("heading", { name: /PT156 - June 19, 2026/i })

    const editLinks = screen.getAllByRole("link", { name: /view explanation/i })
    expect(editLinks.length).toBeGreaterThan(0)
    expect(editLinks[0]).toHaveAttribute("href", "/app/learn/explanations/q/q1")
  })

  it("shows padded your time and under/over vs target", async () => {
    renderResultsPage()
    await screen.findByRole("heading", { name: /PT156 - June 19, 2026/i })
    expect(screen.getByText("01:20")).toBeInTheDocument()
    expect(screen.getByText("(00:25 under)")).toBeInTheDocument()
  })

  it("bookmarks a question and filters the list with Bookmarked only", async () => {
    const user = userEvent.setup()
    renderResultsPage()
    await screen.findByRole("heading", { name: /PT156 - June 19, 2026/i })

    expect(screen.getByText(/PT 156\s+\.\s+S1\s+\.\s+Q1/)).toBeInTheDocument()
    expect(screen.getByText(/PT 156\s+\.\s+S1\s+\.\s+Q2/)).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Bookmark question" })[0]!)
    await waitFor(() => {
      expect(mockSetQuestionBookmark).toHaveBeenCalledWith("q1", true)
    })
    expect(screen.getByRole("button", { name: "Remove bookmark" })).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Show bookmarked only" }))
    expect(screen.getByText(/PT 156\s+\.\s+S1\s+\.\s+Q1/)).toBeInTheDocument()
    expect(screen.queryByText(/PT 156\s+\.\s+S2\s+\.\s+Q1/)).not.toBeInTheDocument()
  })

  it("shows Loading instead of Calculating while PrepTest results load", () => {
    mockGetPrepTestSessionDetail.mockReturnValue(new Promise(() => {}))
    renderResultsPage()

    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
    expect(screen.queryByText(/calculating/i)).not.toBeInTheDocument()
  })
})
