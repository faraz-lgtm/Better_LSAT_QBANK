import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"
import { createAdminApi } from "./admin"

function mockSupabase(invokeImpl: ReturnType<typeof vi.fn>, accessToken = "t1"): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
    functions: { invoke: invokeImpl },
  } as unknown as SupabaseClient
}

describe("createAdminApi catalog queries", () => {
  it("countPrepTests asks the list endpoint for a count only", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { rows: [], total: 42 }, error: null })
    const api = createAdminApi(mockSupabase(invoke))
    await expect(api.countPrepTests()).resolves.toBe(42)
    expect(invoke).toHaveBeenCalledWith("admin-list-preptests", {
      method: "POST",
      body: { countOnly: true },
      headers: { Authorization: "Bearer t1" },
    })
  })

  it("countCourses asks the list endpoint for a count only", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { rows: [], total: 3 }, error: null })
    const api = createAdminApi(mockSupabase(invoke))
    await expect(api.countCourses()).resolves.toBe(3)
    expect(invoke).toHaveBeenCalledWith("admin-list-courses", {
      method: "POST",
      body: { countOnly: true },
      headers: { Authorization: "Bearer t1" },
    })
  })

  it("listPrepTests sends page and search to the server", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { rows: [{ id: "1" }], total: 11 }, error: null })
    const api = createAdminApi(mockSupabase(invoke))
    const result = await api.listPrepTests(10, 10, "lr", "141")
    expect(result.total).toBe(11)
    expect(invoke).toHaveBeenCalledWith("admin-list-preptests", {
      method: "POST",
      body: { limit: 10, offset: 10, contentFilter: "lr", search: "141" },
      headers: { Authorization: "Bearer t1" },
    })
  })

  it("listPrepTestSummaries skips stats", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { rows: [{ id: "1" }], total: 1 }, error: null })
    const api = createAdminApi(mockSupabase(invoke))
    await api.listPrepTestSummaries()
    expect(invoke).toHaveBeenCalledWith("admin-list-preptests", {
      method: "POST",
      body: { summaryOnly: true },
      headers: { Authorization: "Bearer t1" },
    })
  })

  it("impersonateStudent returns token hash and student summary", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        tokenHash: "hash-1",
        student: { id: "s1", email: "s@x.com", full_name: "Sam" },
      },
      error: null,
    })
    const api = createAdminApi(mockSupabase(invoke))
    await expect(api.impersonateStudent("s1")).resolves.toEqual({
      tokenHash: "hash-1",
      student: { id: "s1", email: "s@x.com", full_name: "Sam" },
    })
    expect(invoke).toHaveBeenCalledWith("admin-impersonate-student", {
      method: "POST",
      body: { studentUserId: "s1" },
      headers: { Authorization: "Bearer t1" },
    })
  })

  it("endImpersonation posts studentUserId", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null })
    const api = createAdminApi(mockSupabase(invoke))
    await expect(api.endImpersonation("s1")).resolves.toBe(true)
    expect(invoke).toHaveBeenCalledWith("admin-end-impersonation", {
      method: "POST",
      body: { studentUserId: "s1" },
      headers: { Authorization: "Bearer t1" },
    })
  })
})
