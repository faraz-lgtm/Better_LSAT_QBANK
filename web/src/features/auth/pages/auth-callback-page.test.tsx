import { StrictMode } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { store } from "@/app/store"
import { resetEnsureStudentSessionInflight } from "@/features/student-session/ensure-student-session"
import { resetStudentSession } from "@/features/student-session/studentSessionSlice"
import { AuthCallbackPage } from "./auth-callback-page"

const { trackFreeDiagnosticSignupAndWaitMock } = vi.hoisted(() => ({
  trackFreeDiagnosticSignupAndWaitMock: vi.fn(
    async (_payload?: unknown, _timeoutMs?: number) => {},
  ),
}))

vi.mock("@/lib/analytics/gtm", async () => {
  const actual = await vi.importActual<typeof import("@/lib/analytics/gtm")>("@/lib/analytics/gtm")
  return {
    ...actual,
    trackFreeDiagnosticSignupAndWait: trackFreeDiagnosticSignupAndWaitMock,
  }
})

vi.mock("@/lib/analytics/attribution", () => ({
  readAttribution: () => ({ gclid: "test-gclid" }),
}))

vi.mock("@/lib/analytics/posthog", () => ({
  AnalyticsEvent: {
    authCompleted: "auth_completed",
    freeDiagnosticSignup: "free_diagnostic_signup",
  },
  captureEvent: vi.fn(),
}))

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
}
const invokeMock = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: authMock, functions: { invoke: invokeMock } }),
}))

type SessionUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

/** Fresh login: no session until exchange/verify runs, then return `user`. */
function mockSessionAfterAuth(user: SessionUser) {
  let authed = false
  authMock.exchangeCodeForSession.mockImplementation(async () => {
    authed = true
    return { error: null }
  })
  authMock.verifyOtp.mockImplementation(async () => {
    authed = true
    return { error: null }
  })
  authMock.getSession.mockImplementation(async () => ({
    data: { session: authed ? { user } : null },
    error: null,
  }))
}

function mockExistingSession(user: SessionUser) {
  authMock.getSession.mockResolvedValue({
    data: { session: { user } },
    error: null,
  })
}

function renderCallback(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<p>Onboarding view</p>} />
        <Route path="/reset-password" element={<p>Reset password view</p>} />
        <Route path="/checkout" element={<p>Checkout view</p>} />
        <Route path="/app" element={<p>App view</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    authMock.exchangeCodeForSession.mockReset()
    authMock.verifyOtp.mockReset()
    authMock.getSession.mockReset()
    authMock.updateUser.mockReset()
    authMock.updateUser.mockResolvedValue({ error: null })
    invokeMock.mockReset()
    trackFreeDiagnosticSignupAndWaitMock.mockReset()
    trackFreeDiagnosticSignupAndWaitMock.mockImplementation(async () => {})
    store.dispatch(resetStudentSession())
    resetEnsureStudentSessionInflight()
    sessionStorage.clear()
    localStorage.clear()
    window.dataLayer = []
    window.history.pushState({}, "", "/")
  })

  function mockUsersInvoke(options?: {
    tracked?: boolean
    alreadyTracked?: boolean
    profile?: Record<string, unknown> | null
  }) {
    const tracked = options?.tracked ?? false
    const profile = options?.profile === undefined ? null : options.profile
    invokeMock.mockImplementation((functionName: string, invokeOptions?: { body?: Record<string, unknown>; method?: string }) => {
      const action = invokeOptions?.body?.action
      const isSignupConversion =
        functionName === "users-track-signup-conversion" ||
        action === "users-track-signup-conversion"
      if (isSignupConversion) {
        return Promise.resolve({
          data: {
            tracked,
            alreadyTracked: options?.alreadyTracked ?? false,
            eventId: "signup:u1",
            email: "u1@example.com",
            attribution: { gclid: "test-gclid" },
          },
          error: null,
        })
      }
      return Promise.resolve({ data: { profile }, error: null })
    })
  }

  it("exchanges auth code and redirects to onboarding when session exists", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?code=test-code")

    renderCallback("/auth/callback?code=test-code")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("test-code")
  })

  it("redirects to /reset-password when callback type is recovery", async () => {
    mockSessionAfterAuth({ id: "u1" })
    window.history.pushState({}, "", "/auth/callback?code=test-code&type=recovery")

    renderCallback("/auth/callback?code=test-code&type=recovery")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("test-code")
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it("redirects a returning user to the selected paid checkout plan", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    invokeMock.mockImplementation((functionName: string, invokeOptions?: { body?: Record<string, unknown> }) => {
      if (
        functionName === "users-track-signup-conversion" ||
        invokeOptions?.body?.action === "users-track-signup-conversion"
      ) {
        return Promise.resolve({
          data: {
            tracked: false,
            alreadyTracked: true,
            eventId: "signup:u1",
            email: "u1@example.com",
            attribution: null,
          },
          error: null,
        })
      }
      if (functionName === "users") {
        return Promise.resolve({
          data: {
            profile: {
              id: "u1",
              role: "student",
              is_first_time_login: false,
            },
          },
          error: null,
        })
      }
      return Promise.resolve({
        data: {
          entitlement: {
            accessState: "PAYMENT_REQUIRED",
            hasActiveCore: false,
          },
        },
        error: null,
      })
    })
    window.localStorage.setItem(
      "betterlsat:pending-checkout-plan",
      "three_month",
    )
    window.history.pushState({}, "", "/auth/callback?code=paid-code")

    renderCallback("/auth/callback?code=paid-code")

    expect(await screen.findByText(/checkout view/i)).toBeInTheDocument()
    expect(invokeMock).toHaveBeenCalledWith(
      "users-track-signup-conversion",
      expect.objectContaining({
        body: expect.objectContaining({
          checkoutPlan: "three_month",
        }),
      }),
    )
  })

  it("completes auth under React StrictMode with a single PKCE exchange", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?code=strict-code")

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/auth/callback?code=strict-code"]}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/onboarding" element={<p>Onboarding view</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    )

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("strict-code")
  })

  it("shows an error when callback has no code and no session", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    window.history.pushState({}, "", "/auth/callback")

    renderCallback("/auth/callback")

    expect(
      await screen.findByText(/auth session not found/i),
    ).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("fires free_diagnostic_signup when signup conversion is tracked", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: true })
    window.history.pushState({}, "", "/auth/callback?code=gtm-code")

    renderCallback("/auth/callback?code=gtm-code")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(trackFreeDiagnosticSignupAndWaitMock).toHaveBeenCalledTimes(1)
    expect(trackFreeDiagnosticSignupAndWaitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_email: "u1@example.com",
        user_id: "u1",
        event_id: "signup:u1",
        gclid: "test-gclid",
      }),
      300,
    )
  })

  it("stamps bl_attr onto user_metadata when missing (Google path)", async () => {
    mockSessionAfterAuth({
      id: "u1",
      email: "u1@example.com",
      user_metadata: {},
    })
    mockUsersInvoke({ tracked: true })
    window.history.pushState({}, "", "/auth/callback?code=google-stamp")

    renderCallback("/auth/callback?code=google-stamp")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.updateUser).toHaveBeenCalledWith({
      data: {
        attribution: { gclid: "test-gclid" },
        checkout_plan: "free",
      },
    })
  })

  it("does not restamp user_metadata when attribution already present", async () => {
    mockSessionAfterAuth({
      id: "u1",
      email: "u1@example.com",
      user_metadata: { attribution: { utm_source: "email" }, checkout_plan: "free" },
    })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?code=already-stamped")

    renderCallback("/auth/callback?code=already-stamped")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.updateUser).not.toHaveBeenCalled()
  })

  it("does not fire free_diagnostic_signup when conversion already tracked", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: false, alreadyTracked: true })
    window.history.pushState({}, "", "/auth/callback?code=no-gtm-code")

    renderCallback("/auth/callback?code=no-gtm-code")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(trackFreeDiagnosticSignupAndWaitMock).not.toHaveBeenCalled()
  })

  it("does not fire free_diagnostic_signup on recovery flow", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: true })
    window.history.pushState({}, "", "/auth/callback?code=recovery-code&type=recovery")

    renderCallback("/auth/callback?code=recovery-code&type=recovery")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(trackFreeDiagnosticSignupAndWaitMock).not.toHaveBeenCalled()
  })

  it("verifies token_hash magic link and redirects to onboarding", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?token_hash=ml-hash&type=magiclink")

    renderCallback("/auth/callback?token_hash=ml-hash&type=magiclink")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: "ml-hash",
      type: "magiclink",
    })
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("verifies token_hash recovery and redirects to reset-password", async () => {
    mockSessionAfterAuth({ id: "u1" })
    window.history.pushState({}, "", "/auth/callback?type=recovery&token_hash=rec-hash")

    renderCallback("/auth/callback?type=recovery&token_hash=rec-hash")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: "rec-hash",
      type: "recovery",
    })
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it("completes token_hash auth under React StrictMode with a single verifyOtp", async () => {
    mockSessionAfterAuth({ id: "u1", email: "u1@example.com" })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?token_hash=strict-hash&type=magiclink")

    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/auth/callback?token_hash=strict-hash&type=magiclink"]}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/onboarding" element={<p>Onboarding view</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    )

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.verifyOtp).toHaveBeenCalledTimes(1)
    expect(authMock.verifyOtp).toHaveBeenCalledWith({
      token_hash: "strict-hash",
      type: "magiclink",
    })
  })

  it("hard-blocks code exchange when already signed in", async () => {
    mockExistingSession({ id: "existing", email: "existing@example.com" })
    mockUsersInvoke({
      tracked: false,
      profile: { id: "existing", role: "student", is_first_time_login: false },
    })
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    window.history.pushState({}, "", "/auth/callback?code=other-user-code")

    renderCallback("/auth/callback?code=other-user-code")

    expect(
      await screen.findByText(/already signed in as existing@example.com/i),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /continue to app/i })).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("hard-blocks token_hash verify when already signed in", async () => {
    mockExistingSession({ id: "existing", email: "existing@example.com" })
    mockUsersInvoke({
      tracked: false,
      profile: { id: "existing", role: "student", is_first_time_login: false },
    })
    authMock.verifyOtp.mockResolvedValue({ error: null })
    window.history.pushState({}, "", "/auth/callback?token_hash=other-hash&type=magiclink")

    renderCallback("/auth/callback?token_hash=other-hash&type=magiclink")

    expect(
      await screen.findByText(/already signed in as existing@example.com/i),
    ).toBeInTheDocument()
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("skips recovery exchange when already signed in and goes to reset-password", async () => {
    mockExistingSession({ id: "existing", email: "existing@example.com" })
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    window.history.pushState({}, "", "/auth/callback?code=recovery-code&type=recovery")

    renderCallback("/auth/callback?code=recovery-code&type=recovery")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(authMock.verifyOtp).not.toHaveBeenCalled()
  })
})
