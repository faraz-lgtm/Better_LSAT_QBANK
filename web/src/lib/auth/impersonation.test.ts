import { beforeEach, describe, expect, it, vi } from "vitest"

const getSession = vi.fn()
const setSession = vi.fn()
const verifyOtp = vi.fn()
const invoke = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession, setSession, verifyOtp },
    functions: { invoke },
  }),
}))

const clearStudentSessionCaches = vi.fn()
vi.mock("@/lib/auth/clear-student-session-caches", () => ({
  clearStudentSessionCaches: (...args: unknown[]) => clearStudentSessionCaches(...args),
}))

import {
  clearImpersonationMeta,
  endImpersonation,
  getImpersonationMeta,
  IMPERSONATION_STORAGE_KEY,
  startImpersonation,
} from "./impersonation"

describe("impersonation session swap", () => {
  beforeEach(() => {
    sessionStorage.clear()
    getSession.mockReset()
    setSession.mockReset()
    verifyOtp.mockReset()
    invoke.mockReset()
    clearStudentSessionCaches.mockReset()
  })

  it("startImpersonation stashes admin tokens, verifies OTP, and navigates to /app", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "admin-access",
          refresh_token: "admin-refresh",
          user: { id: "admin-1" },
        },
      },
      error: null,
    })
    invoke.mockResolvedValue({
      data: {
        tokenHash: "hash-xyz",
        student: { id: "s1", email: "s@x.com", full_name: "Sam Student" },
      },
      error: null,
    })
    verifyOtp.mockResolvedValue({ error: null })
    const navigate = vi.fn()

    await startImpersonation("s1", navigate)

    const meta = getImpersonationMeta()
    expect(meta).toMatchObject({
      studentId: "s1",
      studentEmail: "s@x.com",
      studentFullName: "Sam Student",
      adminAccessToken: "admin-access",
      adminRefreshToken: "admin-refresh",
    })
    expect(clearStudentSessionCaches).toHaveBeenCalled()
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-xyz", type: "magiclink" })
    expect(navigate).toHaveBeenCalledWith("/app")
  })

  it("startImpersonation restores admin session if OTP fails", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "admin-access",
          refresh_token: "admin-refresh",
          user: { id: "admin-1" },
        },
      },
      error: null,
    })
    invoke.mockResolvedValue({
      data: {
        tokenHash: "hash-xyz",
        student: { id: "s1", email: "s@x.com", full_name: "Sam" },
      },
      error: null,
    })
    verifyOtp.mockResolvedValue({ error: new Error("otp expired") })
    setSession.mockResolvedValue({ error: null })

    await expect(startImpersonation("s1", vi.fn())).rejects.toThrow("otp expired")
    expect(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY)).toBeNull()
    expect(setSession).toHaveBeenCalledWith({
      access_token: "admin-access",
      refresh_token: "admin-refresh",
    })
  })

  it("endImpersonation restores admin session, audits end, and navigates to students", async () => {
    sessionStorage.setItem(
      IMPERSONATION_STORAGE_KEY,
      JSON.stringify({
        studentId: "s1",
        studentEmail: "s@x.com",
        studentFullName: "Sam",
        adminAccessToken: "admin-access",
        adminRefreshToken: "admin-refresh",
        startedAt: "2026-11-27T00:00:00.000Z",
      }),
    )
    setSession.mockResolvedValue({ error: null })
    invoke.mockResolvedValue({ data: { success: true }, error: null })
    const navigate = vi.fn()

    await endImpersonation(navigate)

    expect(setSession).toHaveBeenCalledWith({
      access_token: "admin-access",
      refresh_token: "admin-refresh",
    })
    expect(clearStudentSessionCaches).toHaveBeenCalled()
    expect(getImpersonationMeta()).toBeNull()
    expect(invoke).toHaveBeenCalledWith(
      "admin-end-impersonation",
      expect.objectContaining({
        body: { studentUserId: "s1" },
      }),
    )
    expect(navigate).toHaveBeenCalledWith("/admin/students")
  })

  it("clearImpersonationMeta removes the stash", () => {
    sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, "{}")
    clearImpersonationMeta()
    expect(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY)).toBeNull()
  })
})
