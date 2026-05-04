import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { SignupPage } from "./signup-page"

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: authMock }),
}))

describe("SignupPage", () => {
  it("renders figma signup surface", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send magic link/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign up with google/i })).toBeInTheDocument()
    expect(screen.getByText(/terms of service/i)).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it("sends magic link after terms are accepted", async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "new@example.com")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /send magic link/i }))

    expect(authMock.signInWithOtp).toHaveBeenCalled()
    expect(await screen.findByText(/magic link sent/i)).toBeInTheDocument()
  })
})
