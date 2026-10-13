import { describe, expect, it, beforeEach } from "vitest"
import {
  cacheExplanationPrepTestList,
  clearExplanationListCache,
  explanationListCacheKey,
  getCachedExplanationPrepTestList,
} from "./explanation-list-cache"

describe("explanation-list-cache", () => {
  beforeEach(() => {
    clearExplanationListCache()
  })

  it("keys by sort and bookmarkedOnly", () => {
    expect(explanationListCacheKey({ sort: "newest", bookmarkedOnly: false })).toBe("newest:all")
    expect(explanationListCacheKey({ sort: "oldest", bookmarkedOnly: true })).toBe("oldest:bookmarked")
  })

  it("stores and returns page-1 list results", () => {
    const entry = {
      prepTests: [
        {
          id: "pt1",
          title: "PrepTest 159",
          moduleId: "LSAC159",
          prepTestNumber: "159",
          questionCount: 100,
          explainedCount: 10,
          rowSubtitle: "Fresh",
        },
      ],
      total: 12,
      statusCounts: { in_process: 1, fresh: 8, answered: 2, seen: 1 },
    }
    cacheExplanationPrepTestList({ sort: "newest", bookmarkedOnly: false }, entry)
    expect(getCachedExplanationPrepTestList({ sort: "newest", bookmarkedOnly: false })).toEqual(entry)
    expect(getCachedExplanationPrepTestList({ sort: "oldest", bookmarkedOnly: false })).toBeNull()
  })
})
