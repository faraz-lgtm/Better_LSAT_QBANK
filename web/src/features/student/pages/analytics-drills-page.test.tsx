import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsDrillsPage } from "@/features/student/pages/analytics-drills-page"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getPriorities: vi.fn(),
  peekCachedAnalyticsSessions: vi.fn((..._args: unknown[]) => null as null | unknown[]),
  peekCachedAnalyticsPriorities: vi.fn(() => null as null | unknown[]),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/analytics")>("@/lib/api/analytics")
  return {
    ...actual,
    createAnalyticsApi: () => ({
      getSessions: mocks.getSessions,
      getPriorities: mocks.getPriorities,
    }),
    peekCachedAnalyticsSessions: mocks.peekCachedAnalyticsSessions,
    peekCachedAnalyticsPriorities: mocks.peekCachedAnalyticsPriorities,
  }
})

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

function renderDrills() {
  return render(
    <MemoryRouter initialEntries={["/app/analytics/drills"]}>
      <Routes>
        <Route path="/app/analytics/drills" element={<AnalyticsDrillsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AnalyticsDrillsPage loading shell", () => {
  beforeEach(() => {
    mocks.getSessions.mockReset()
    mocks.getPriorities.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReset()
    mocks.peekCachedAnalyticsPriorities.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReturnValue(null)
    mocks.peekCachedAnalyticsPriorities.mockReturnValue(null)
  })

  it("paints drills chrome with skeletons while sessions load", async () => {
    const sessions = deferred<{ sessions: unknown[]; total: number; limit: number; offset: number }>()
    const priorities = deferred<unknown[]>()
    mocks.getSessions.mockReturnValue(sessions.promise)
    mocks.getPriorities.mockReturnValue(priorities.promise)

    renderDrills()

    expect(screen.getByRole("heading", { name: "Drills" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading drill analytics")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading drill history")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading drill stats")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading drill chart")).toBeInTheDocument()

    sessions.resolve({ sessions: [], total: 0, limit: 48, offset: 0 })
    priorities.resolve([])

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading drill analytics")).not.toBeInTheDocument()
    })
    expect(screen.getByText(/No drills match the current filters/i)).toBeInTheDocument()
    expect(mocks.getSessions).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "DRILL", limit: 48, skipCount: true }),
    )
  })

  it("seeds from cache and skips cold skeletons", async () => {
    mocks.peekCachedAnalyticsSessions.mockReturnValue([
      {
        id: "drill-1",
        kind: "DRILL",
        startedAt: "2026-10-01T00:00:00.000Z",
        completedAt: "2026-10-01T00:10:00.000Z",
        rawScore: 8,
        scaledScore: 160,
        percentile: 70,
        bookmarked: false,
        excluded: false,
        metadata: { questionTypeId: "qt-1", questionIds: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] },
        prepTestTitle: null,
        sectionTitle: null,
        sectionType: "LR",
      },
    ])
    mocks.peekCachedAnalyticsPriorities.mockReturnValue([])
    mocks.getSessions.mockReturnValue(new Promise(() => undefined))
    mocks.getPriorities.mockReturnValue(new Promise(() => undefined))

    renderDrills()

    expect(screen.getByRole("heading", { name: "Drills" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Loading drill analytics")).not.toBeInTheDocument()
    expect(screen.getByText("Score Progress")).toBeInTheDocument()
  })
})
