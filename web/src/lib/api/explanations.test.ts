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
  it("listPrepTests invokes prep-explanations-prep-tests", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        prepTests: [
          {
            id: "pt1",
            title: "PrepTest 159",
            moduleId: "LSAC159",
            prepTestNumber: "159",
            questionCount: 100,
            explainedCount: 12,
          },
        ],
        total: 12,
        page: 2,
        pageSize: 5,
        statusCounts: { in_process: 1, fresh: 8, answered: 2, seen: 0 },
      },
      error: null,
    })
    const api = createExplanationsApi(mockSupabase(invoke))
    const result = await api.listPrepTests({ page: 2, pageSize: 5, sort: "oldest" })
    expect(result.prepTests).toHaveLength(1)
    expect(result.prepTests[0]?.id).toBe("pt1")
    expect(result.total).toBe(12)
    expect(result.statusCounts.answered).toBe(2)
    expect(invoke).toHaveBeenCalledWith("prep-explanations", {
      method: "POST",
      body: {
        action: "prep-explanations-prep-tests",
        page: 2,
        pageSize: 5,
        sort: "oldest",
      },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getPrepTestTree passes prepTestId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        prepTest: {
          id: "pt1",
          prepTestNumber: "159",
          rowSubtitle: "12 questions with explanations",
          sections: [],
        },
      },
      error: null,
    })
    const api = createExplanationsApi(mockSupabase(invoke))
    const tree = await api.getPrepTestTree("pt1")
    expect(tree.id).toBe("pt1")
    expect(invoke).toHaveBeenCalledWith("prep-explanations", {
      method: "POST",
      body: { action: "prep-explanations-prep-test-tree", prepTestId: "pt1" },
      headers: { Authorization: "Bearer token-1" },
    })
  })

  it("getExplanationDetail passes questionId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        questionId: "q9",
        prepTestId: "pt1",
        prepTestTitle: "PT 2",
        prepTestNumber: "2",
        sectionId: "sec1",
        sectionType: "RC",
        sectionNumber: 1,
        questionNumber: 1,
        topicName: "Main point",
        explanationHtml: "<p>x</p>",
        videoUrl: null,
        stimulusText: null,
        stemText: "Stem",
        choices: [{ id: "A", index: 1, text: "a" }],
        correctChoiceId: "A",
        passage: { id: "p1", displayNumber: 1, title: "Passage 1", body: "body" },
      },
      error: null,
    })
    const api = createExplanationsApi(mockSupabase(invoke))
    const d = await api.getExplanationDetail("q9")
    expect(d.questionId).toBe("q9")
    expect(invoke).toHaveBeenCalledWith("prep-explanations", {
      method: "POST",
      body: { action: "prep-explanation-detail", questionId: "q9" },
      headers: { Authorization: "Bearer token-1" },
    })
  })
})
