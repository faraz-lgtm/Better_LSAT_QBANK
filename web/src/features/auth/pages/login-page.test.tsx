import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LoginPage } from "./login-page"

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
  })

  it("renders figma login surface", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /login with/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send magic link/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument()
  })

  it("sends login magic link", async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const emailInputs = screen.getAllByPlaceholderText(/enter your email/i)
    await user.type(emailInputs[0], "login@example.com")
    await user.click(screen.getByRole("button", { name: /send magic link/i }))

    expect(authMock.signInWithOtp).toHaveBeenCalled()
    expect(await screen.findByText(/magic link sent/i)).toBeInTheDocument()
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
