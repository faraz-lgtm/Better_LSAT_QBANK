import { beforeEach, describe, expect, it, vi } from "vitest"

const getMyProfile = vi.fn()
const getEntitlementState = vi.fn()
const getSession = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession },
  }),
}))

vi.mock("@/lib/api/users", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/users")>("@/lib/api/users")
  return {
    ...actual,
    createUsersApi: () => ({
      getMyProfile,
      getEntitlementState,
      getStudyContext: vi.fn(),
    }),
  }
})

import { store } from "@/app/store"
import {
  ensureEntitlement,
  ensureProfile,
  resetEnsureStudentSessionInflight,
} from "./ensure-student-session"
import { resetStudentSession } from "./studentSessionSlice"

const studentProfile = {
  id: "u1",
  email: "a@b.com",
  full_name: "Ada",
  first_name: "Ada",
  last_name: null,
  phone: null,
  role: "student" as const,
  student_coaching_id: null,
  is_first_time_login: false,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

function mockAuthUser(userId: string | null) {
  getSession.mockResolvedValue({
    data: { session: userId ? { user: { id: userId } } : null },
  })
}

describe("ensureStudentSession", () => {
  beforeEach(() => {
    getMyProfile.mockReset()
    getEntitlementState.mockReset()
    getSession.mockReset()
    mockAuthUser("u1")
    store.dispatch(resetStudentSession())
    resetEnsureStudentSessionInflight()
  })

  it("shares one profile fetch across concurrent ensureProfile callers", async () => {
    let resolveProfile: (value: unknown) => void = () => undefined
    getMyProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve
      }),
    )

    const first = ensureProfile()
    const second = ensureProfile()
    resolveProfile(studentProfile)

    const [a, b] = await Promise.all([first, second])
    expect(getMyProfile).toHaveBeenCalledTimes(1)
    expect(a?.email).toBe("a@b.com")
    expect(b?.email).toBe("a@b.com")
  })

  it("returns cached entitlement without a second network call", async () => {
    getEntitlementState.mockResolvedValue({
      isAuthenticated: true,
      isLsacLinked: true,
      isLsacEligible: true,
      hasActiveCore: true,
      accessState: "FULL_ACCESS",
    })

    await ensureEntitlement()
    await ensureEntitlement()

    expect(getEntitlementState).toHaveBeenCalledTimes(1)
  })

  it("refetches after a cached null profile so onboarding-created rows are visible", async () => {
    getMyProfile.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...studentProfile,
      full_name: "Ada Lovelace",
      last_name: "Lovelace",
      is_first_time_login: true,
    })

    expect(await ensureProfile()).toBeNull()
    expect(await ensureProfile()).toMatchObject({ id: "u1", first_name: "Ada" })
    expect(getMyProfile).toHaveBeenCalledTimes(2)
  })

  it("refetches when cached profile belongs to a different auth user", async () => {
    getMyProfile
      .mockResolvedValueOnce({
        ...studentProfile,
        id: "admin-1",
        role: "super_admin",
        full_name: "Admin",
        first_name: "Admin",
      })
      .mockResolvedValueOnce(studentProfile)

    mockAuthUser("admin-1")
    expect(await ensureProfile()).toMatchObject({ id: "admin-1", role: "super_admin" })
    expect(getMyProfile).toHaveBeenCalledTimes(1)

    mockAuthUser("u1")
    expect(await ensureProfile()).toMatchObject({ id: "u1", role: "student" })
    expect(getMyProfile).toHaveBeenCalledTimes(2)
  })

  it("returns null without refetch when signed out with a stale cached profile", async () => {
    getMyProfile.mockResolvedValueOnce({
      ...studentProfile,
      id: "admin-1",
      role: "super_admin",
    })

    mockAuthUser("admin-1")
    expect(await ensureProfile()).toMatchObject({ id: "admin-1" })

    mockAuthUser(null)
    expect(await ensureProfile()).toBeNull()
    expect(getMyProfile).toHaveBeenCalledTimes(1)
  })
})
