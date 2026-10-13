import type { SupabaseClient } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createAnalyticsApi,
  peekCachedAnalyticsOverview,
  peekCachedAnalyticsPriorities,
  peekCachedAnalyticsSessions,
  resetAnalyticsPageBundleCache,
} from "./analytics"

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
        skipCount: undefined,
        limit: 500,
        offset: 0,
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

  it("getPageBundle shares one in-flight request across concurrent callers", async () => {
    let resolveInvoke: (value: { data: unknown; error: null }) => void = () => undefined
    const invoke = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveInvoke = resolve
      }),
    )
    const api = createAnalyticsApi(mockSupabase(invoke))

    const first = api.getPageBundle("dashboard")
    const second = api.getPageBundle("dashboard")
    resolveInvoke({
      data: {
        view: "dashboard",
        overview: {
          bestScaledScore: 170,
          averageScaledScore: 165,
          completedPrepTestCount: 1,
          totalQuestionsAnswered: 10,
          drillAccuracyPct: 80,
          totalDrillQuestionsAnswered: 10,
          averageLrMissedPerPrepTest: 2,
          averageRcMissedPerPrepTest: 3,
          totalStudyMinutes: 5,
        },
        trajectory: [],
        sessions: { sessions: [], total: 0, limit: 50, offset: 0 },
        priorities: [],
      },
      error: null,
    })

    const [a, b] = await Promise.all([first, second])
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(a.overview?.totalStudyMinutes).toBe(5)
    expect(b.overview?.totalStudyMinutes).toBe(5)
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

  it("peekCachedAnalyticsOverview returns dashboard overview while overview bundle is cold", async () => {
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
        sessions: { sessions: [], total: 0, limit: 12, offset: 0 },
        priorities: [],
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))
    expect(peekCachedAnalyticsOverview()).toBeNull()
    await api.getPageBundle("dashboard")
    expect(peekCachedAnalyticsOverview()?.bestScaledScore).toBe(170)
  })

  it("getSessions caches pages and peeks seed insight routes", async () => {
    const session = {
      id: "drill-1",
      kind: "DRILL",
      startedAt: "2026-10-01T00:00:00.000Z",
      completedAt: "2026-10-01T00:10:00.000Z",
      rawScore: 8,
      scaledScore: 160,
      percentile: 70,
      bookmarked: false,
      excluded: false,
      metadata: { questionTypeId: "qt-1", questionIds: ["q1", "q2"] },
      prepTestTitle: null,
      sectionTitle: null,
      sectionType: "LR",
    }
    const invoke = vi.fn().mockResolvedValue({
      data: { sessions: [session], total: 1, limit: 500, offset: 0 },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    expect(peekCachedAnalyticsSessions("DRILL", { completedOnly: true })).toBeNull()

    const first = await api.getSessions({
      kind: "DRILL",
      completedOnly: true,
      limit: 500,
      skipCount: true,
    })
    expect(first.sessions).toHaveLength(1)
    expect(invoke).toHaveBeenCalledWith(
      "analytics-sessions",
      expect.objectContaining({
        body: expect.objectContaining({
          kind: "DRILL",
          completedOnly: true,
          limit: 500,
          skipCount: true,
        }),
      }),
    )
    expect(peekCachedAnalyticsSessions("DRILL", { completedOnly: true })?.[0]?.id).toBe("drill-1")

    const second = await api.getSessions({
      kind: "DRILL",
      completedOnly: true,
      limit: 500,
      skipCount: true,
    })
    expect(second.sessions[0]?.id).toBe("drill-1")
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it("getPriorities serves from cache and peeks for drill filters", async () => {
    const priorities = [
      {
        questionTypeId: "qt-1",
        name: "Assumption",
        sectionType: "LR" as const,
        attemptCount: 10,
        correctCount: 5,
        accuracyPct: 50,
        goalAccuracy: 80,
        gap: 30,
        priorityTier: "high" as const,
        priorityLevel: "high" as const,
        priorityScore: 1,
      },
    ]
    const invoke = vi.fn().mockResolvedValue({
      data: { priorities },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    expect(peekCachedAnalyticsPriorities()).toBeNull()
    await api.getPriorities()
    expect(peekCachedAnalyticsPriorities()?.[0]?.questionTypeId).toBe("qt-1")
    await api.getPriorities()
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it("overview bundle peeks seed completed session caches", async () => {
    const section = {
      id: "sec-1",
      kind: "SECTION",
      startedAt: "2026-10-01T00:00:00.000Z",
      completedAt: "2026-10-01T00:35:00.000Z",
      rawScore: 20,
      scaledScore: null,
      percentile: null,
      bookmarked: false,
      excluded: false,
      metadata: {},
      prepTestTitle: "PT 10",
      sectionTitle: "LR",
      sectionType: "LR",
    }
    const invoke = vi.fn().mockResolvedValue({
      data: {
        view: "overview",
        overview: {
          bestScaledScore: 170,
          averageScaledScore: 165,
          completedPrepTestCount: 1,
          totalQuestionsAnswered: 50,
          drillAccuracyPct: 80,
          totalDrillQuestionsAnswered: 10,
          averageLrMissedPerPrepTest: 2,
          averageRcMissedPerPrepTest: 3,
          totalStudyMinutes: 12,
        },
        trajectory: [],
        priorities: [
          {
            questionTypeId: "qt-2",
            name: "Main Point",
            sectionType: "LR",
            attemptCount: 4,
            correctCount: 2,
            accuracyPct: 50,
            goalAccuracy: 80,
            gap: 30,
            priorityTier: "medium",
            priorityLevel: "medium",
            priorityScore: 2,
          },
        ],
        drillSessions: { sessions: [], total: 0, limit: 8, offset: 0 },
        sectionSessions: { sessions: [section], total: 1, limit: 8, offset: 0 },
        prepTestSessions: { sessions: [], total: 0, limit: 8, offset: 0 },
      },
      error: null,
    })
    const api = createAnalyticsApi(mockSupabase(invoke))
    await api.getPageBundle("overview")
    expect(peekCachedAnalyticsSessions("SECTION", { completedOnly: true })?.[0]?.id).toBe("sec-1")
    expect(peekCachedAnalyticsPriorities()?.[0]?.name).toBe("Main Point")
  })

  it("getPageBundle overview fallback requests a small history preview", async () => {
    resetAnalyticsPageBundleCache()
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
        return { data: { sessions: [], total: 0, limit: 8, offset: 0 }, error: null }
      }
      if (fn === "analytics-priorities") {
        return { data: { priorities: [] }, error: null }
      }
      return { data: null, error: new Error(`unexpected ${fn}`) }
    })
    const api = createAnalyticsApi(mockSupabase(invoke))

    const out = await api.getPageBundle("overview")

    expect(out.view).toBe("overview")
    expect(out.drillSessions?.limit).toBe(8)
    const sessionCalls = invoke.mock.calls.filter(([fn]) => fn === "analytics-sessions")
    expect(sessionCalls).toHaveLength(3)
    for (const [, opts] of sessionCalls) {
      expect(opts.body.limit).toBe(8)
      expect(opts.body.completedOnly).toBe(true)
    }
  })
})
