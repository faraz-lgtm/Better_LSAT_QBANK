import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsPage } from "@/features/student/pages/analytics-page"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mocks = vi.hoisted(() => ({
  getPageBundle: vi.fn(),
  getOverview: vi.fn(),
  getPriorities: vi.fn(),
  getSessions: vi.fn(),
  peekCachedAnalyticsOverview: vi.fn(() => null as null | {
    bestScaledScore: number
    averageScaledScore: number
    bestPercentile: number | null
    averagePercentile: number | null
    completedPrepTestCount: number
    totalQuestionsAnswered: number
    drillAccuracyPct: number | null
    totalDrillQuestionsAnswered: number
    averageLrMissedPerPrepTest: number | null
    averageRcMissedPerPrepTest: number | null
    totalStudyMinutes: number
  }),
  ensureStudyContext: vi.fn().mockResolvedValue({ preferences: { goalScore: 160 } }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/analytics")>("@/lib/api/analytics")
  return {
    ...actual,
    createAnalyticsApi: () => ({
      getPageBundle: mocks.getPageBundle,
      getOverview: mocks.getOverview,
      getPriorities: mocks.getPriorities,
      getSessions: mocks.getSessions,
    }),
    peekCachedAnalyticsOverview: () => mocks.peekCachedAnalyticsOverview(),
  }
})

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    updateStudyPreferences: vi.fn(),
  }),
}))

vi.mock("@/features/student-session/ensure-student-session", () => ({
  ensureStudyContext: () => mocks.ensureStudyContext(),
}))

function renderOverview() {
  return render(
    <MemoryRouter initialEntries={["/app/analytics"]}>
      <Routes>
        <Route path="/app/analytics" element={<AnalyticsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AnalyticsPage overview loading shell", () => {
  beforeEach(() => {
    mocks.getPageBundle.mockReset()
    mocks.getOverview.mockReset()
    mocks.peekCachedAnalyticsOverview.mockReset()
    mocks.peekCachedAnalyticsOverview.mockReturnValue(null)
    mocks.ensureStudyContext.mockReset()
    mocks.ensureStudyContext.mockResolvedValue({ preferences: { goalScore: 160 } })
  })

  it("paints overview chrome with skeletons while the bundle loads", async () => {
    const bundle = deferred<{
      view: string
      overview: Record<string, unknown>
      trajectory: unknown[]
      priorities: unknown[]
      drillSessions: { sessions: unknown[]; total: number; limit: number; offset: number }
      sectionSessions: { sessions: unknown[]; total: number; limit: number; offset: number }
      prepTestSessions: { sessions: unknown[]; total: number; limit: number; offset: number }
    }>()
    mocks.getPageBundle.mockReturnValue(bundle.promise)

    renderOverview()

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All Time" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading overview stats")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading score chart")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading weaknesses")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument()
    expect(screen.queryByText("Loading overview…")).not.toBeInTheDocument()

    bundle.resolve({
      view: "overview",
      overview: {
        bestScaledScore: 170,
        averageScaledScore: 160,
        bestPercentile: 90,
        averagePercentile: 80,
        completedPrepTestCount: 2,
        totalQuestionsAnswered: 100,
        drillAccuracyPct: 75,
        totalDrillQuestionsAnswered: 40,
        averageLrMissedPerPrepTest: 3,
        averageRcMissedPerPrepTest: 4,
        totalStudyMinutes: 120,
      },
      trajectory: [],
      priorities: [],
      drillSessions: { sessions: [], total: 0, limit: 8, offset: 0 },
      sectionSessions: { sessions: [], total: 0, limit: 8, offset: 0 },
      prepTestSessions: { sessions: [], total: 0, limit: 8, offset: 0 },
    })

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading overview stats")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Best Score")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Test Performance History" })).toBeInTheDocument()
  })

  it("shows seeded stats immediately when dashboard overview is cached", async () => {
    mocks.peekCachedAnalyticsOverview.mockReturnValue({
      bestScaledScore: 176,
      averageScaledScore: 123,
      bestPercentile: 99.2,
      averagePercentile: 0.8,
      completedPrepTestCount: 10,
      totalQuestionsAnswered: 500,
      drillAccuracyPct: 21.6,
      totalDrillQuestionsAnswered: 100,
      averageLrMissedPerPrepTest: 23,
      averageRcMissedPerPrepTest: 25,
      totalStudyMinutes: 200,
    })
    mocks.getPageBundle.mockReturnValue(new Promise(() => undefined))

    renderOverview()

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByText("Best Score")).toBeInTheDocument()
    expect(screen.getAllByText("176").length).toBeGreaterThan(0)
    expect(screen.queryByLabelText("Loading overview stats")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Loading score chart")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument()
  })
})
