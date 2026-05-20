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
        },
      ],
    })

    render(
      <MemoryRouter>
        <PracticeBlindReviewPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Ready for Blind Review/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(listBlindReviewPool).toHaveBeenCalled()
    })
  })
})
