import { describe, expect, it, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

import { useReviewPassageAnalysis } from "@/features/student/practice-session/use-review-passage-analysis"

const getExplanationDetail = vi.fn()

vi.mock("@/lib/api/explanations", () => ({
  createExplanationsApi: () => ({ getExplanationDetail }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("useReviewPassageAnalysis", () => {
  beforeEach(() => {
    getExplanationDetail.mockReset()
  })

  it("skips fetch for LR", async () => {
    const { result } = renderHook(() =>
      useReviewPassageAnalysis({
        enabled: true,
        questionId: "q1",
        sectionType: "LR",
      }),
    )
    await waitFor(() => {
      expect(result.current.analysisAvailable).toBe(false)
    })
    expect(getExplanationDetail).not.toHaveBeenCalled()
  })

  it("loads RC passage analysis when available", async () => {
    getExplanationDetail.mockResolvedValue({
      passageAnalysis: {
        paragraphs: [{ label: "P1", explanationHtml: "<p>A</p>" }],
        overallHtml: null,
      },
    })
    const { result } = renderHook(() =>
      useReviewPassageAnalysis({
        enabled: true,
        questionId: "q1",
        sectionType: "RC",
      }),
    )
    await waitFor(() => {
      expect(result.current.analysisAvailable).toBe(true)
    })
    expect(result.current.passageAnalysis?.paragraphs[0]?.label).toBe("P1")
    expect(getExplanationDetail).toHaveBeenCalledWith("q1")
  })
})
