import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { UserEntitlement, UserProfile } from "@/lib/api/users"

const getMyProfile = vi.fn()
const getEntitlementState = vi.fn()
const getStudyContext = vi.fn()

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
      getStudyContext,
    }),
  }
})

import studentSessionReducer, {
  hydrateStudentSession,
  loadEntitlement,
  loadProfile,
  loadStudyContext,
  resetStudentSession,
  type StudentSessionState,
} from "./studentSessionSlice"

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "u1",
    email: "a@b.com",
    full_name: "Ada Lovelace",
    first_name: "Ada",
    last_name: "Lovelace",
    phone: null,
    avatar_url: null,
    role: "student",
    student_coaching_id: "c1",
    is_first_time_login: false,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  }
}

function entitlement(overrides: Partial<UserEntitlement> = {}): UserEntitlement {
  return {
    isAuthenticated: true,
    isLsacLinked: true,
    isLsacEligible: true,
    hasActiveCore: true,
    accessState: "FULL_ACCESS",
    ...overrides,
  }
}

function makeStore(preloaded?: Partial<StudentSessionState>) {
  return configureStore({
    reducer: { studentSession: studentSessionReducer },
    preloadedState: preloaded
      ? {
          studentSession: {
            profile: null,
            profileStatus: "idle" as const,
            profileError: null,
            entitlement: null,
            entitlementStatus: "idle" as const,
            entitlementError: null,
            studyContext: null,
            studyContextStatus: "idle" as const,
            studyContextError: null,
            ...preloaded,
          },
        }
      : undefined,
  })
}

describe("studentSessionSlice", () => {
  beforeEach(() => {
    getMyProfile.mockReset()
    getEntitlementState.mockReset()
    getStudyContext.mockReset()
  })

  it("loads profile once and skips a second dispatch while succeeded", async () => {
    getMyProfile.mockResolvedValue(profile())
    const store = makeStore()

    await store.dispatch(loadProfile())
    await store.dispatch(loadProfile())

    expect(getMyProfile).toHaveBeenCalledTimes(1)
    expect(store.getState().studentSession.profile?.email).toBe("a@b.com")
    expect(store.getState().studentSession.profileStatus).toBe("succeeded")
  })

  it("shares one in-flight profile fetch across concurrent dispatches", async () => {
    let resolveProfile: (value: UserProfile) => void = () => undefined
    getMyProfile.mockReturnValue(
      new Promise<UserProfile>((resolve) => {
        resolveProfile = resolve
      }),
    )
    const store = makeStore()

    const first = store.dispatch(loadProfile())
    const second = store.dispatch(loadProfile())
    resolveProfile(profile())
    await Promise.all([first, second])

    expect(getMyProfile).toHaveBeenCalledTimes(1)
    expect(store.getState().studentSession.profileStatus).toBe("succeeded")
  })

  it("hydrates session from login and skips network for entitlement", async () => {
    getEntitlementState.mockResolvedValue(entitlement())
    const store = makeStore()
    store.dispatch(
      hydrateStudentSession({
        profile: profile(),
        entitlement: entitlement(),
      }),
    )

    await store.dispatch(loadEntitlement())

    expect(getEntitlementState).not.toHaveBeenCalled()
    expect(store.getState().studentSession.entitlement?.accessState).toBe("FULL_ACCESS")
  })

  it("reset clears all session fields", () => {
    const store = makeStore({
      profile: profile(),
      profileStatus: "succeeded",
      entitlement: entitlement(),
      entitlementStatus: "succeeded",
      studyContext: { preferences: null, officialScores: [] },
      studyContextStatus: "succeeded",
    })

    store.dispatch(resetStudentSession())

    expect(store.getState().studentSession).toEqual({
      profile: null,
      profileStatus: "idle",
      profileError: null,
      entitlement: null,
      entitlementStatus: "idle",
      entitlementError: null,
      studyContext: null,
      studyContextStatus: "idle",
      studyContextError: null,
    })
  })

  it("retries study context after failure", async () => {
    getStudyContext
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ preferences: null, officialScores: [] })
    const store = makeStore()

    await store.dispatch(loadStudyContext())
    expect(store.getState().studentSession.studyContextStatus).toBe("failed")

    await store.dispatch(loadStudyContext())
    expect(getStudyContext).toHaveBeenCalledTimes(2)
    expect(store.getState().studentSession.studyContextStatus).toBe("succeeded")
  })
})
