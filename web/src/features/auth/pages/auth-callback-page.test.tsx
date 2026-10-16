import { StrictMode } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { store } from "@/app/store"
import { resetEnsureStudentSessionInflight } from "@/features/student-session/ensure-student-session"
import { resetStudentSession } from "@/features/student-session/studentSessionSlice"
import { AuthCallbackPage } from "./auth-callback-page"

const trackFreeDiagnosticSignupAndWaitMock = vi.fn(
  async (_payload?: unknown, _timeoutMs?: number) => {},
)

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
}
const invokeMock = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: authMock, functions: { invoke: invokeMock } }),
}))

function renderCallback(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/onboarding" element={<p>Onboarding view</p>} />
        <Route path="/reset-password" element={<p>Reset password view</p>} />
        <Route path="/checkout" element={<p>Checkout view</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    authMock.exchangeCodeForSession.mockReset()
    authMock.verifyOtp.mockReset()
    authMock.getSession.mockReset()
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
    invokeMock.mockImplementation((_functionName: string, invokeOptions?: { body?: Record<string, unknown>; method?: string }) => {
      const action = invokeOptions?.body?.action
      if (action === "users-track-signup-conversion") {
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
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
    mockUsersInvoke({ tracked: false })
    window.history.pushState({}, "", "/auth/callback?code=test-code")

    renderCallback("/auth/callback?code=test-code")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("test-code")
  })

  it("redirects to /reset-password when callback type is recovery", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    window.history.pushState({}, "", "/auth/callback?code=test-code&type=recovery")

    renderCallback("/auth/callback?code=test-code&type=recovery")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("test-code")
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it("redirects a returning user to the selected paid checkout plan", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
    invokeMock.mockImplementation((functionName: string, invokeOptions?: { body?: Record<string, unknown> }) => {
      if (invokeOptions?.body?.action === "users-track-signup-conversion") {
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
  })

  it("completes auth under React StrictMode with a single PKCE exchange", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
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
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
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

  it("does not fire free_diagnostic_signup when conversion already tracked", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
    mockUsersInvoke({ tracked: false, alreadyTracked: true })
    window.history.pushState({}, "", "/auth/callback?code=no-gtm-code")

    renderCallback("/auth/callback?code=no-gtm-code")

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(trackFreeDiagnosticSignupAndWaitMock).not.toHaveBeenCalled()
  })

  it("does not fire free_diagnostic_signup on recovery flow", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
    mockUsersInvoke({ tracked: true })
    window.history.pushState({}, "", "/auth/callback?code=recovery-code&type=recovery")

    renderCallback("/auth/callback?code=recovery-code&type=recovery")

    expect(await screen.findByText(/reset password view/i)).toBeInTheDocument()
    expect(trackFreeDiagnosticSignupAndWaitMock).not.toHaveBeenCalled()
  })

  it("verifies token_hash magic link and redirects to onboarding", async () => {
    authMock.verifyOtp.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
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
    authMock.verifyOtp.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
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
    authMock.verifyOtp.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1", email: "u1@example.com" } } },
      error: null,
    })
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
})
