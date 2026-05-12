import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResetPasswordPage } from "./reset-password-page"

const authMock = {
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: authMock }),
}))

function renderResetPage() {
  return render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={<p>Dashboard view</p>} />
        <Route path="/forgot-password" element={<p>Forgot password view</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    authMock.getSession.mockReset()
    authMock.updateUser.mockReset()
  })

  it("shows expired state when there is no recovery session", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: null }, error: null })

    renderResetPage()

    expect(await screen.findByRole("heading", { name: /reset link expired/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toBeInTheDocument()
  })

  it("updates password and navigates to /app on success", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    authMock.updateUser.mockResolvedValue({ error: null })
    const user = userEvent.setup()

    renderResetPage()

    expect(await screen.findByRole("heading", { name: /set a new password/i })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/enter a new password/i), "supersecret")
    await user.type(screen.getByPlaceholderText(/re-enter your new password/i), "supersecret")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    expect(authMock.updateUser).toHaveBeenCalledWith({ password: "supersecret" })
    expect(await screen.findByText(/dashboard view/i)).toBeInTheDocument()
  })

  it("warns when passwords do not match", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    const user = userEvent.setup()

    renderResetPage()

    expect(await screen.findByRole("heading", { name: /set a new password/i })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/enter a new password/i), "supersecret")
    await user.type(screen.getByPlaceholderText(/re-enter your new password/i), "different")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(authMock.updateUser).not.toHaveBeenCalled()
  })

  it("rejects passwords that are too short", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    })
    const user = userEvent.setup()

    renderResetPage()

    expect(await screen.findByRole("heading", { name: /set a new password/i })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/enter a new password/i), "abc")
    await user.type(screen.getByPlaceholderText(/re-enter your new password/i), "abc")
    await user.click(screen.getByRole("button", { name: /update password/i }))

    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument()
    expect(authMock.updateUser).not.toHaveBeenCalled()
  })
})
