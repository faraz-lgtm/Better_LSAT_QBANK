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

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    authMock.exchangeCodeForSession.mockReset()
    authMock.getSession.mockReset()
    invokeMock.mockReset()
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

    render(
      <MemoryRouter initialEntries={["/auth/callback?code=test-code"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<p>Onboarding view</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/onboarding view/i)).toBeInTheDocument()
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith("test-code")
  })
})
