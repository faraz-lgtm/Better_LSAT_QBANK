import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createAnalyticsApi } from "./analytics"

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
})
