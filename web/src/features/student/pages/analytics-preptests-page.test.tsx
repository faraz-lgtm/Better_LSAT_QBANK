import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsPrepTestsPage } from "@/features/student/pages/analytics-preptests-page"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  peekCachedAnalyticsSessions: vi.fn((..._args: unknown[]) => null as null | unknown[]),
  ensureStudyContext: vi.fn().mockResolvedValue({ preferences: { goalScore: 170 } }),
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
    }),
    peekCachedAnalyticsSessions: mocks.peekCachedAnalyticsSessions,
  }
})

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

vi.mock("@/features/student-session/ensure-student-session", () => ({
  ensureStudyContext: () => mocks.ensureStudyContext(),
}))

function renderPrepTests() {
  return render(
    <MemoryRouter initialEntries={["/app/analytics/preptests"]}>
      <Routes>
        <Route path="/app/analytics/preptests" element={<AnalyticsPrepTestsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AnalyticsPrepTestsPage loading shell", () => {
  beforeEach(() => {
    mocks.getSessions.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReturnValue(null)
    mocks.ensureStudyContext.mockReset()
    mocks.ensureStudyContext.mockResolvedValue({ preferences: { goalScore: 170 } })
  })

  it("paints PrepTest chrome with skeletons while sessions load", async () => {
    const sessions = deferred<{ sessions: unknown[]; total: number; limit: number; offset: number }>()
    mocks.getSessions.mockReturnValue(sessions.promise)

    renderPrepTests()

    expect(screen.getByRole("heading", { name: "PrepTest Insights" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading PrepTest stats")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading PrepTest chart")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading PrepTest history")).toBeInTheDocument()

    sessions.resolve({ sessions: [], total: 0, limit: 500, offset: 0 })

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading PrepTest stats")).not.toBeInTheDocument()
    })
    expect(screen.getByText(/No PrepTests recorded/i)).toBeInTheDocument()
  })

  it("seeds from cache and skips cold skeletons", async () => {
    mocks.peekCachedAnalyticsSessions.mockImplementation((kind: unknown) => {
      if (kind === "PREPTEST") {
        return [
          {
            id: "pt-1",
            kind: "PREPTEST",
            prepTestId: "pt-10",
            startedAt: "2026-10-01T00:00:00.000Z",
            completedAt: "2026-10-01T03:00:00.000Z",
            rawScore: 70,
            scaledScore: 168,
            percentile: 90,
            bookmarked: false,
            excluded: false,
            metadata: {},
            prepTestTitle: "PrepTest 10",
            sectionTitle: null,
            sectionType: null,
          },
        ]
      }
      return []
    })
    mocks.getSessions.mockReturnValue(new Promise(() => undefined))

    renderPrepTests()

    expect(screen.getByRole("heading", { name: "PrepTest Insights" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Loading PrepTest stats")).not.toBeInTheDocument()
    expect(screen.getByText("Peak Score")).toBeInTheDocument()
    expect(screen.getAllByText("168").length).toBeGreaterThan(0)
  })
})
