import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createAnalyticsApi, resetAnalyticsPageBundleCache } from "./analytics"

function mockSupabase(functionsInvoke: ReturnType<typeof vi.fn>, accessToken = "token-1"): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
    functions: {
      invoke: functionsInvoke,
    },
  } as unknown as SupabaseClient
}

describe("createAnalyticsApi", () => {
  beforeEach(() => {
    resetAnalyticsPageBundleCache()
  })

  it("getOverview invokes analytics-overview", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        bestScaledScore: 170,
        averageScaledScore: 165,
        completedPrepTestCount: 2,
        totalQuestionsAnswered: 50,
        drillAccuracyPct: 80,
        totalDrillQuestionsAnswered: 10,
        averageLrMissedPerPrepTest: 2,
        averageRcMissedPerPrepTest: 3,
        totalStudyMinutes: 0,
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    const out = await api.getOverview()

    expect(out.bestScaledScore).toBe(170)
    expect(invoke).toHaveBeenCalledWith("analytics-overview", {
      method: "POST",
      body: {},
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getOverview forwards completedSince when provided", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        bestScaledScore: 160,
        averageScaledScore: 158,
        completedPrepTestCount: 1,
        totalQuestionsAnswered: 10,
        drillAccuracyPct: 70,
        totalDrillQuestionsAnswered: 5,
        averageLrMissedPerPrepTest: 4,
        averageRcMissedPerPrepTest: 5,
        totalStudyMinutes: 30,
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))
    const completedSince = "2026-08-31T12:00:00.000Z"

    const out = await api.getOverview({ completedSince })

    expect(out.bestScaledScore).toBe(160)
    expect(invoke).toHaveBeenCalledWith("analytics-overview", {
      method: "POST",
      body: { completedSince },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getQuestionTypeReview invokes analytics-question-type-review", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        questionTypeId: "qt-1",
        name: "Flaw",
        sectionType: "LR",
        attemptCount: 1,
        correctCount: 0,
        attempts: [],
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    const out = await api.getQuestionTypeReview("qt-1")

    expect(out.questionTypeId).toBe("qt-1")
    expect(invoke).toHaveBeenCalledWith("analytics-question-type-review", {
      method: "POST",
      body: { questionTypeId: "qt-1", limit: 100 },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getSessions passes completedOnly for analytics history", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { sessions: [], total: 0, limit: 500, offset: 0 },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    await api.getSessions({ kind: "SECTION", completedOnly: true, limit: 500 })

    expect(invoke).toHaveBeenCalledWith("analytics-sessions", {
      method: "POST",
      body: {
        kind: "SECTION",
        bookmarked: undefined,
        completedOnly: true,
        limit: 500,
        offset: undefined,
      },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getPageBundle invokes analytics-overview with include", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        view: "dashboard",
        overview: {
          bestScaledScore: 170,
          averageScaledScore: 165,
          completedPrepTestCount: 2,
          totalQuestionsAnswered: 50,
          drillAccuracyPct: 80,
          totalDrillQuestionsAnswered: 10,
          averageLrMissedPerPrepTest: 2,
          averageRcMissedPerPrepTest: 3,
          totalStudyMinutes: 12,
        },
        trajectory: [],
        sessions: { sessions: [], total: 0, limit: 50, offset: 0 },
        priorities: [],
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    const out = await api.getPageBundle("dashboard")

    expect(out.overview?.totalStudyMinutes).toBe(12)
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith("analytics-overview", {
      method: "POST",
      body: { include: "dashboard" },
      headers: { Authorization: "Bearer token-1" },
    })

    await api.getPageBundle("dashboard")
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it("getPageBundle falls back when include is ignored (flat overview)", async () => {
    const invoke = vi.fn().mockImplementation(async (fn: string) => {
      if (fn === "analytics-overview") {
        return {
          data: {
            bestScaledScore: 170,
            averageScaledScore: 165,
            bestPercentile: null,
            averagePercentile: null,
            completedPrepTestCount: 2,
            totalQuestionsAnswered: 50,
            drillAccuracyPct: 80,
            totalDrillQuestionsAnswered: 10,
            averageLrMissedPerPrepTest: 2,
            averageRcMissedPerPrepTest: 3,
            totalStudyMinutes: 12,
          },
          error: null,
        }
      }
      if (fn === "analytics-trajectory") {
        return { data: { points: [] }, error: null }
      }
      if (fn === "analytics-sessions") {
        return { data: { sessions: [], total: 0, limit: 50, offset: 0 }, error: null }
      }
      if (fn === "analytics-priorities") {
        return { data: { priorities: [] }, error: null }
      }
      return { data: null, error: new Error(`unexpected ${fn}`) }
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    const out = await api.getPageBundle("dashboard")

    expect(out.view).toBe("dashboard")
    expect(out.overview?.totalStudyMinutes).toBe(12)
    expect(out.trajectory).toEqual([])
    expect(out.sessions?.sessions).toEqual([])
    expect(out.priorities).toEqual([])
    expect(invoke).toHaveBeenCalledWith("analytics-overview", {
      method: "POST",
      body: { include: "dashboard" },
      headers: { Authorization: "Bearer token-1" },
    })
    expect(invoke).toHaveBeenCalledWith("analytics-trajectory", expect.any(Object))
    expect(invoke).toHaveBeenCalledWith("analytics-sessions", expect.any(Object))
    expect(invoke).toHaveBeenCalledWith("analytics-priorities", expect.any(Object))
  })
})
