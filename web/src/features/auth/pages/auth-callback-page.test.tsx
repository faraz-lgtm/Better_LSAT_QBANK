import { StrictMode } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthCallbackPage } from "./auth-callback-page"

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
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
      </Routes>
    </MemoryRouter>,
  )
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    authMock.exchangeCodeForSession.mockReset()
    authMock.getSession.mockReset()
    invokeMock.mockReset()
    sessionStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("exchanges auth code and redirects to onboarding when session exists", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    invokeMock.mockResolvedValue({ data: { profile: null }, error: null })
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

  it("completes auth under React StrictMode with a single PKCE exchange", async () => {
    authMock.exchangeCodeForSession.mockResolvedValue({ error: null })
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    invokeMock.mockResolvedValue({ data: { profile: null }, error: null })
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
})
