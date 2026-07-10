import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createLsacApi } from "./lsac"

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>, accessToken: string | null = "t1"): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: { invoke: invokeImpl },
  } as unknown as SupabaseClient
}

describe("createLsacApi", () => {
  it("getDeepLinkUrl invokes lsac-deeplink with testId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { url: "https://lawhub.org/prep/deeplink?vendorId=v1&studentCoachingId=c1&testId=LSAT-PT-93" },
      error: null,
    })
    const api = createLsacApi(mockSupabase(invoke))
    const url = await api.getDeepLinkUrl({ testId: "LSAT-PT-93", sectionId: "AR:116" })
    expect(url).toContain("LSAT-PT-93")
    expect(invoke).toHaveBeenCalledWith("lsac-deeplink", {
      method: "POST",
      body: { testId: "LSAT-PT-93", sectionId: "AR:116" },
      headers: { Authorization: "Bearer t1" },
    })
  })
})
