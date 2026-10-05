import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SignupCheckEmailPage } from "./signup-check-email-page"
import { SignupPage } from "./signup-page"

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
}

const functionsInvoke = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: authMock,
    functions: { invoke: functionsInvoke },
  }),
}))

describe("SignupPage", () => {
  beforeEach(() => {
    authMock.signInWithOtp.mockReset()
    authMock.signInWithOAuth.mockReset()
    functionsInvoke.mockReset()
    functionsInvoke.mockResolvedValue({ data: { exists: false }, error: null })
  })

  it("renders figma signup surface", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send confirmation link/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument()
    expect(screen.getAllByText(/terms of service/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it("sends magic link after terms are accepted", async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/check-email" element={<SignupCheckEmailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "new@example.com")
    await user.click(screen.getAllByRole("checkbox")[0])
    await user.click(screen.getByRole("button", { name: /send confirmation link/i }))

    expect(functionsInvoke).toHaveBeenCalledWith(
      "auth-check-email",
      expect.objectContaining({
        method: "POST",
        body: { email: "new@example.com" },
      }),
    )
    expect(authMock.signInWithOtp).toHaveBeenCalled()
    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument()
    expect(screen.getByText(/we just sent you a login link/i)).toBeInTheDocument()
  })

  it("warns when the email already has an account", async () => {
    functionsInvoke.mockResolvedValue({ data: { exists: true }, error: null })
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/check-email" element={<SignupCheckEmailPage />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "existing@example.com")
    await user.click(screen.getAllByRole("checkbox")[0])
    await user.click(screen.getByRole("button", { name: /send confirmation link/i }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/already exists/i)
    expect(alert.querySelector('a[href="/login"]')).not.toBeNull()
    expect(authMock.signInWithOtp).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: /check your email/i })).not.toBeInTheDocument()
  })

  it("sends magic link only once on rapid double-click", async () => {
    let resolveOtp: (() => void) | undefined
    authMock.signInWithOtp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOtp = () => resolve({ error: null })
        }),
    )
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/check-email" element={<SignupCheckEmailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/enter your email/i), "new@example.com")
    await user.click(screen.getAllByRole("checkbox")[0])

    const submitButton = screen.getByRole("button", { name: /send confirmation link/i })
    await user.dblClick(submitButton)

    expect(authMock.signInWithOtp).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveOtp?.()
    })
  })
})
