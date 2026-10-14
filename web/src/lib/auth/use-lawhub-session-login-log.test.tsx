import { configureStore } from "@reduxjs/toolkit"
import { act, renderHook, waitFor } from "@testing-library/react"
import { Provider } from "react-redux"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

import studentSessionReducer, {
  hydrateStudentSession,
  setProfile,
} from "@/features/student-session/studentSessionSlice"
import type { UserProfile } from "@/lib/api/users"
import {
  hasLawHubLoginBeenLoggedThisSession,
  markLawHubLoginLoggedThisSession,
  resetLawHubLoginSessionGuardForTests,
} from "@/lib/auth/lawhub-session-log"
import { useLawHubSessionLoginLog } from "@/lib/auth/use-lawhub-session-login-log"

const lawHubLogLogin = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/users")>()
  return {
    ...actual,
    createUsersApi: () => ({
      getMyProfile: vi.fn(),
      lawHubLogLogin,
    }),
  }
})

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
    student_coaching_id: null,
    is_first_time_login: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  }
}

function createStore() {
  return configureStore({
    reducer: { studentSession: studentSessionReducer },
  })
}

function wrapperFor(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }
}

describe("useLawHubSessionLoginLog", () => {
  beforeEach(() => {
    resetLawHubLoginSessionGuardForTests()
    lawHubLogLogin.mockReset()
    lawHubLogLogin.mockResolvedValue(undefined)
    vi.stubGlobal("requestIdleCallback", (cb: IdleRequestCallback) => {
      cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    })
    vi.stubGlobal("cancelIdleCallback", () => {})
  })

  it("does not mark the session or call LSAC when the profile still needs a link", async () => {
    const store = createStore()
    store.dispatch(hydrateStudentSession({ profile: profile() }))

    renderHook(() => useLawHubSessionLoginLog(), { wrapper: wrapperFor(store) })

    await act(async () => {
      await Promise.resolve()
    })

    expect(hasLawHubLoginBeenLoggedThisSession()).toBe(false)
    expect(lawHubLogLogin).not.toHaveBeenCalled()
  })

  it("logs once after the profile gains a coaching id in the same session", async () => {
    const store = createStore()
    store.dispatch(hydrateStudentSession({ profile: profile() }))

    const { rerender } = renderHook(() => useLawHubSessionLoginLog(), {
      wrapper: wrapperFor(store),
    })

    await act(async () => {
      await Promise.resolve()
    })
    expect(lawHubLogLogin).not.toHaveBeenCalled()

    await act(async () => {
      store.dispatch(setProfile(profile({ student_coaching_id: "coach-1" })))
      rerender()
    })

    await waitFor(() => {
      expect(lawHubLogLogin).toHaveBeenCalledTimes(1)
    })
    expect(hasLawHubLoginBeenLoggedThisSession()).toBe(true)
  })

  it("does not call LSAC again when the session guard is already set", async () => {
    markLawHubLoginLoggedThisSession()
    const store = createStore()
    store.dispatch(
      hydrateStudentSession({ profile: profile({ student_coaching_id: "coach-1" }) }),
    )

    renderHook(() => useLawHubSessionLoginLog(), { wrapper: wrapperFor(store) })

    await act(async () => {
      await Promise.resolve()
    })

    expect(lawHubLogLogin).not.toHaveBeenCalled()
  })
})
