import { describe, expect, it, vi } from "vitest"

import { createTutoringApi } from "@/lib/api/tutoring"

describe("createTutoringApi", () => {
  it("invokes tutoring-list-sessions with auth header", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        hasActivePackage: false,
        nextSession: null,
        upcomingSessions: [],
        pastSessions: [],
        activePackage: null,
      },
      error: null,
    })
    const getSession = vi.fn().mockResolvedValue({
      data: { session: { access_token: "tok_123" } },
    })
    const api = createTutoringApi({
      auth: { getSession },
      functions: { invoke },
    } as never)

    const result = await api.listSessions()
    expect(result.pastSessions).toEqual([])
    expect(invoke).toHaveBeenCalledWith(
      "tutoring-list-sessions",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer tok_123" },
      }),
    )
  })

  it("invokes tutoring-get-transcript with sessionId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        sessionId: "s1",
        title: "LR",
        metaLabel: "Nov 5",
        takeaways: [],
        currentTime: "00:00",
        totalTime: "00:00",
        segments: [],
        lines: [],
        recordingUrl: null,
      },
      error: null,
    })
    const api = createTutoringApi({
      auth: { getSession: async () => ({ data: { session: null } }) },
      functions: { invoke },
    } as never)

    await api.getTranscript("s1")
    expect(invoke).toHaveBeenCalledWith(
      "tutoring-get-transcript",
      expect.objectContaining({
        body: { sessionId: "s1" },
      }),
    )
  })
})
