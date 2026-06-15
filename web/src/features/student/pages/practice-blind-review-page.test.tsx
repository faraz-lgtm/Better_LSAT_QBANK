import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { PracticeBlindReviewPage } from "@/features/student/pages/practice-blind-review-page"

const listBlindReviewPool = vi.fn()

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    listBlindReviewPool,
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("PracticeBlindReviewPage", () => {
  it("lists eligible prep tests for blind review", async () => {
    listBlindReviewPool.mockResolvedValue({
      prepTests: [
        {
          id: "pt-1",
          moduleId: "LSAC101",
          title: "PrepTest 101",
          prepTestNumber: "101",
          label: "PT 101",
          questionCount: 75,
          status: "eligible",
          scaledScore: 160,
          blindReviewScaledScore: null,
          completedAt: "2026-01-01T00:00:00Z",
          blindReviewCompletedAt: null,
          prepTestSessionId: "sess-1",
          attempts: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 5,
      statusCounts: { all: 1, eligible: 1, in_progress: 0, completed: 0 },
    })

    render(
      <MemoryRouter>
        <PracticeBlindReviewPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/^Ready$/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(listBlindReviewPool).toHaveBeenCalledWith({
        filter: "all",
        page: 1,
        pageSize: 5,
      })
    })
  })
})
