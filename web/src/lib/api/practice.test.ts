import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createPracticeApi } from "./practice"

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

describe("createPracticeApi", () => {
  it("createSession invokes practice-create-session", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        session: {
          id: "s1",
          user_id: "u1",
          kind: "PREPTEST",
          prep_test_id: "pt1",
          section_id: null,
          started_at: "2026-01-01T00:00:00Z",
          completed_at: null,
          raw_score: null,
          scaled_score: null,
          percentile: null,
          bookmarked: false,
          excluded: false,
          metadata: {},
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      },
      error: null,
    })
    const api = createPracticeApi(mockSupabase(invoke))

    const session = await api.createSession({ kind: "PREPTEST", prepTestId: "pt1" })

    expect(session.id).toBe("s1")
    expect(invoke).toHaveBeenCalledWith("practice-create-session", {
      method: "POST",
      body: {
        kind: "PREPTEST",
        prepTestId: "pt1",
        sectionId: undefined,
        metadata: undefined,
      },
      headers: { Authorization: "Bearer token-1" },
    })
  })
})
