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

  it("invokes tutoring-list-todos with sessionId", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { sessionId: "s1", todos: [] },
      error: null,
    })
    const api = createTutoringApi({
      auth: { getSession: async () => ({ data: { session: null } }) },
      functions: { invoke },
    } as never)

    await api.listTodos("s1")
    expect(invoke).toHaveBeenCalledWith(
      "tutoring-list-todos",
      expect.objectContaining({
        body: { sessionId: "s1" },
      }),
    )
  })

  it("invokes tutoring-create-todo and tutoring-update-todo", async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "t1",
          sessionId: "s1",
          title: "Drill flaws",
          tag: "Homework",
          done: false,
          createdLabel: "Nov 12, 2026",
          dueLabel: "No due date",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "t1",
          sessionId: "s1",
          title: "Drill flaws",
          tag: "Homework",
          done: true,
          createdLabel: "Nov 12, 2026",
          dueLabel: "No due date",
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "t1",
          sessionId: "s1",
          title: "Drill more flaws",
          tag: "Review",
          done: true,
          createdLabel: "Nov 12, 2026",
          dueLabel: "Due Nov 20",
          dueAt: "2026-11-20T00:00:00.000Z",
        },
        error: null,
      })
    const api = createTutoringApi({
      auth: { getSession: async () => ({ data: { session: null } }) },
      functions: { invoke },
    } as never)

    await api.createTodo({ sessionId: "s1", title: "Drill flaws" })
    await api.updateTodo({ todoId: "t1", done: true })
    await api.updateTodo({
      todoId: "t1",
      title: "Drill more flaws",
      tag: "Review",
      dueAt: "2026-11-20",
    })
    expect(invoke).toHaveBeenNthCalledWith(
      1,
      "tutoring-create-todo",
      expect.objectContaining({
        body: { sessionId: "s1", title: "Drill flaws" },
      }),
    )
    expect(invoke).toHaveBeenNthCalledWith(
      2,
      "tutoring-update-todo",
      expect.objectContaining({
        body: { todoId: "t1", done: true },
      }),
    )
    expect(invoke).toHaveBeenNthCalledWith(
      3,
      "tutoring-update-todo",
      expect.objectContaining({
        body: {
          todoId: "t1",
          title: "Drill more flaws",
          tag: "Review",
          dueAt: "2026-11-20",
        },
      }),
    )
  })
})
