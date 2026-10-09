import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LoginPage } from "./login-page"
import { LoginEmailCheckPage } from "./signup-check-email-page"

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

describe("LoginPage", () => {
  beforeEach(() => {
    authMock.signInWithOtp.mockReset()
    authMock.signInWithPassword.mockReset()
    authMock.signInWithOAuth.mockReset()
    invokeMock.mockReset()
    window.localStorage.clear()
  })

  it("renders figma login surface", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /login with/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send confirmation link/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument()
  })

  it("sends login magic link", async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/email-check" element={<LoginEmailCheckPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const emailInputs = screen.getAllByPlaceholderText(/enter your email/i)
    await user.type(emailInputs[0], "login@example.com")
    await user.click(screen.getByRole("button", { name: /send confirmation link/i }))

    expect(authMock.signInWithOtp).toHaveBeenCalled()
    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument()
    expect(screen.getByText(/we just sent you a login link/i)).toBeInTheDocument()
  })

  it("retains selected checkout intent when an existing user signs in", async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/login?plan=six_month"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/email-check" element={<LoginEmailCheckPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const emailInputs = screen.getAllByPlaceholderText(/enter your email/i)
    await user.type(emailInputs[0], "login@example.com")
    await user.click(screen.getByRole("button", { name: /send confirmation link/i }))

    expect(window.localStorage.getItem("betterlsat:pending-checkout-plan")).toBe(
      "six_month",
    )
    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument()
  })

  it("submits email and password login", async () => {
    authMock.signInWithPassword.mockResolvedValue({ error: null })
    invokeMock.mockResolvedValue({ data: { profile: null }, error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const emailInputs = screen.getAllByPlaceholderText(/enter your email/i)
    await user.type(emailInputs[1], "user@example.com")
    await user.type(screen.getByPlaceholderText(/enter your password/i), "secret")
    await user.click(screen.getByRole("button", { name: /^sign in$/i }))

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    })
  })
})
