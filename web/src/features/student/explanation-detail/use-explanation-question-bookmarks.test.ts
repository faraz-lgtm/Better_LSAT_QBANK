import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockListQuestionBookmarks, mockSetQuestionBookmark } = vi.hoisted(() => ({
  mockListQuestionBookmarks: vi.fn(),
  mockSetQuestionBookmark: vi.fn(),
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

import { useExplanationQuestionBookmarks } from "@/features/student/explanation-detail/use-explanation-question-bookmarks"

describe("useExplanationQuestionBookmarks", () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockListQuestionBookmarks.mockReset()
    mockSetQuestionBookmark.mockReset()
    mockListQuestionBookmarks.mockResolvedValue({ questionIds: [] })
    mockSetQuestionBookmark.mockResolvedValue({ questionIds: ["q1"] })
  })

  it("loads bookmarks from the API and toggles a question", async () => {
    mockListQuestionBookmarks.mockResolvedValue({ questionIds: ["q2"] })
    const { result } = renderHook(() => useExplanationQuestionBookmarks())

    await waitFor(() => {
      expect(result.current.bookmarkedIds.has("q2")).toBe(true)
    })

    act(() => {
      result.current.toggleQuestionBookmark("q1")
    })

    expect(result.current.bookmarkedIds.has("q1")).toBe(true)
    await waitFor(() => {
      expect(mockSetQuestionBookmark).toHaveBeenCalledWith("q1", true)
    })
    await waitFor(() => {
      expect([...result.current.bookmarkedIds]).toEqual(["q1"])
    })
  })

  it("reverts the optimistic bookmark when the API fails", async () => {
    mockSetQuestionBookmark.mockRejectedValueOnce(new Error("network"))
    const { result } = renderHook(() => useExplanationQuestionBookmarks())

    await waitFor(() => {
      expect(mockListQuestionBookmarks).toHaveBeenCalled()
    })

    act(() => {
      result.current.toggleQuestionBookmark("q1")
    })
    expect(result.current.bookmarkedIds.has("q1")).toBe(true)

    await waitFor(() => {
      expect(result.current.bookmarkedIds.has("q1")).toBe(false)
    })
  })
})
