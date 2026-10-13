import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AnalyticsSectionsPage } from "@/features/student/pages/analytics-sections-page"

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

function renderSections() {
  return render(
    <MemoryRouter initialEntries={["/app/analytics/sections"]}>
      <Routes>
        <Route path="/app/analytics/sections" element={<AnalyticsSectionsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AnalyticsSectionsPage loading shell", () => {
  beforeEach(() => {
    mocks.getSessions.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReset()
    mocks.peekCachedAnalyticsSessions.mockReturnValue(null)
  })

  it("paints section chrome with skeletons while sessions load", async () => {
    const sessions = deferred<{ sessions: unknown[]; total: number; limit: number; offset: number }>()
    mocks.getSessions.mockReturnValue(sessions.promise)

    renderSections()

    expect(screen.getByRole("heading", { name: "Section Insights" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading section stats")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading section chart")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading section history")).toBeInTheDocument()

    sessions.resolve({ sessions: [], total: 0, limit: 500, offset: 0 })

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading section stats")).not.toBeInTheDocument()
    })
    expect(screen.getByText(/No LR sections recorded/i)).toBeInTheDocument()
  })

  it("seeds from cache and skips cold skeletons", async () => {
    mocks.peekCachedAnalyticsSessions.mockReturnValue([
      {
        id: "sec-1",
        kind: "SECTION",
        startedAt: "2026-10-01T00:00:00.000Z",
        completedAt: "2026-10-01T00:35:00.000Z",
        rawScore: 20,
        scaledScore: null,
        percentile: null,
        bookmarked: false,
        excluded: false,
        metadata: { questionCount: 25 },
        prepTestTitle: "PrepTest 10",
        sectionTitle: "Section 1",
        sectionType: "LR",
      },
    ])
    mocks.getSessions.mockReturnValue(new Promise(() => undefined))

    renderSections()

    expect(screen.getByRole("heading", { name: "Section Insights" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Loading section stats")).not.toBeInTheDocument()
  })
})
