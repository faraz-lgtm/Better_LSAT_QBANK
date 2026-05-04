import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ForgotPasswordPage } from "./forgot-password-page"

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: authMock }),
}))

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    authMock.resetPasswordForEmail.mockReset()
  })

  it("renders forgot password surface", () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /forgot your password/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /back to login/i })).toBeInTheDocument()
  })

  it("sends a password reset email with recovery callback url", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback?type=recovery"),
      }),
    )
    expect(await screen.findByText(/reset link sent/i)).toBeInTheDocument()
  })

  it("renders an error message when reset fails", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({ error: new Error("rate limit hit") })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "user@example.com")
    await user.click(screen.getByRole("button", { name: /send reset link/i }))

    expect(await screen.findByText(/rate limit hit/i)).toBeInTheDocument()
  })
})
