import { describe, expect, it, vi } from "vitest"

import {
  checkedFromToggleEvent,
  filterBookmarkedOnly,
  persistSessionBookmark,
  sessionBookmarkState,
  withSessionBookmark,
} from "@/features/student/analytics/session-bookmarks"

const items = [
  { id: "a", bookmarked: true, label: "A" },
  { id: "b", bookmarked: false, label: "B" },
]

describe("session-bookmarks", () => {
  it("filters to bookmarked rows only when the toggle is on", () => {
    expect(filterBookmarkedOnly(items, false)).toEqual(items)
    expect(filterBookmarkedOnly(items, true)).toEqual([{ id: "a", bookmarked: true, label: "A" }])
  })

  it("toggles bookmark state from the current row, not a missing overlay default", () => {
    expect(sessionBookmarkState(items, "a")).toBe(true)
    expect(withSessionBookmark(items, "a", false)[0]?.bookmarked).toBe(false)
  })

  it("reads switch checked state without throwing on a malformed event", () => {
    expect(checkedFromToggleEvent({} as Event)).toBe(false)
    expect(checkedFromToggleEvent({ target: undefined, currentTarget: undefined })).toBe(false)
    const input = document.createElement("input")
    input.type = "checkbox"
    input.checked = true
    expect(checkedFromToggleEvent({ target: input })).toBe(true)
  })

  it("rolls bookmark state back when the API fails", async () => {
    const onFailure = vi.fn()
    await persistSessionBookmark({
      sessionId: "a",
      bookmarked: true,
      practiceApi: {
        updateSession: () => Promise.reject(new Error("fail")),
      },
      onFailure,
    })
    expect(onFailure).toHaveBeenCalledTimes(1)
  })
})
