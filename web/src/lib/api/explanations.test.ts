import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createExplanationsApi } from "./explanations"

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

describe("createExplanationsApi", () => {
  it("listExplanations invokes prep-explanations-list", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        explanations: [
          {
            questionId: "q1",
            prepTestTitle: "PT 1",
            sectionType: "LR" as const,
            questionNumber: 2,
            topicName: "Flaw",
            hasWrittenExplanation: true,
            hasVideo: false,
            lastAttemptedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
      error: null,
    })
    const api = createExplanationsApi(mockSupabase(invoke))
    const rows = await api.listExplanations()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.questionId).toBe("q1")
    expect(invoke).toHaveBeenCalledWith("prep-explanations-list", {
      method: "POST",
      body: {},
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getExplanationDetail passes questionId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        questionId: "q9",
        prepTestTitle: "PT 2",
        sectionType: "RC",
        questionNumber: 1,
        topicName: "Main point",
        explanationHtml: "<p>x</p>",
        videoUrl: null,
      },
      error: null,
    })
    const api = createExplanationsApi(mockSupabase(invoke))
    const d = await api.getExplanationDetail("q9")
    expect(d.questionId).toBe("q9")
    expect(invoke).toHaveBeenCalledWith("prep-explanation-detail", {
      method: "POST",
      body: { questionId: "q9" },
      headers: { Authorization: "Bearer token-1" },
    })
  })
})
