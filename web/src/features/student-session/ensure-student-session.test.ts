import { beforeEach, describe, expect, it, vi } from "vitest"

const getMyProfile = vi.fn()
const getEntitlementState = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
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

describe("ensureStudentSession", () => {
  beforeEach(() => {
    getMyProfile.mockReset()
    getEntitlementState.mockReset()
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
    resolveProfile({
      id: "u1",
      email: "a@b.com",
      full_name: "Ada",
      first_name: "Ada",
      last_name: null,
      phone: null,
      role: "student",
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    })

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
      id: "u1",
      email: "a@b.com",
      full_name: "Ada Lovelace",
      first_name: "Ada",
      last_name: "Lovelace",
      phone: null,
      role: "student",
      student_coaching_id: null,
      is_first_time_login: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    })

    expect(await ensureProfile()).toBeNull()
    expect(await ensureProfile()).toMatchObject({ id: "u1", first_name: "Ada" })
    expect(getMyProfile).toHaveBeenCalledTimes(2)
  })
})
