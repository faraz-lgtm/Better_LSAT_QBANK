import { afterEach, describe, expect, it, vi } from "vitest"
import type { SectionSessionResponse } from "@/features/student/sections/section-types"
import {
  cacheSectionSession,
  clearSectionSessionCache,
  getCachedSectionSession,
  takeCachedSectionSession,
} from "./section-session-cache"

function stubSession(id: string): SectionSessionResponse {
  return {
    session: { id, kind: "SECTION" },
    metadata: { sectionType: "LR", questionIds: [] },
    section: { id: "sec-1", sectionType: "LR", questionCount: 0, timeMinutes: 35 },
    questions: [],
    answers: [],
    blindReviewAnswers: [],
    blindReviewRawScore: null,
    sessionLabel: null,
  } as unknown as SectionSessionResponse
}

describe("section-session-cache", () => {
  afterEach(() => {
    clearSectionSessionCache()
    vi.useRealTimers()
  })

  it("caches and returns a session by id", () => {
    const data = stubSession("sess-1")
    cacheSectionSession("sess-1", data)
    expect(getCachedSectionSession("sess-1")).toEqual(data)
  })

  it("takeCachedSectionSession removes the entry", () => {
    const data = stubSession("sess-2")
    cacheSectionSession("sess-2", data)
    expect(takeCachedSectionSession("sess-2")).toEqual(data)
    expect(getCachedSectionSession("sess-2")).toBeNull()
  })

  it("expires after TTL", () => {
    vi.useFakeTimers()
    cacheSectionSession("sess-3", stubSession("sess-3"))
    vi.advanceTimersByTime(46_000)
    expect(getCachedSectionSession("sess-3")).toBeNull()
  })
})
