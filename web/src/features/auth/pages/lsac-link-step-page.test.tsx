import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LsacLinkStepPage } from "./lsac-link-step-page"

const getMyProfile = vi.fn()
const getEntitlementState = vi.fn()
const lawHubConfirmUrl = vi.fn()
const lawHubRefresh = vi.fn()
const lawHubLink = vi.fn()
const lawHubLogLogin = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    getMyProfile,
    getEntitlementState,
    lawHubConfirmUrl,
    lawHubRefresh,
    lawHubLink,
    lawHubLogLogin,
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/app/lsac-link-step"]}>
      <Routes>
        <Route path="/app/lsac-link-step" element={<LsacLinkStepPage />} />
        <Route path="/app" element={<div>App home</div>} />
        <Route path="/app/pricing" element={<div>Pricing</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("LsacLinkStepPage", () => {
  beforeEach(() => {
    getMyProfile.mockReset()
    getEntitlementState.mockReset()
    lawHubConfirmUrl.mockReset()
    lawHubRefresh.mockReset()
    lawHubLink.mockReset()
    lawHubLogLogin.mockReset()
    vi.stubGlobal("open", vi.fn())
  })

  it("shows path instructions and labels on the invite step", async () => {
    getMyProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Ada Lovelace",
      first_name: "Ada",
      last_name: "Lovelace",
      phone: null,
      avatar_url: null,
      role: "student",
      student_coaching_id: null,
      is_first_time_login: false,
      created_at: "",
      updated_at: "",
    })
    getEntitlementState.mockResolvedValue({
      isAuthenticated: true,
      isLsacLinked: false,
      isLsacEligible: false,
      hasActiveCore: true,
      accessState: "FULL_ACCESS",
    })

    renderPage()

    expect(await screen.findByText(/choose one path/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Set up LawHub with my plan" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Link my existing PrepPlus" })).toBeInTheDocument()
    expect(screen.getByText(/prepplus comes with your plan/i)).toBeInTheDocument()
    expect(screen.getByText(/already pay lsac for prepplus/i)).toBeInTheDocument()
    expect(screen.getByText(/lsac may also email you/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Activate LawHub" })).not.toBeInTheDocument()
  })

  it("shows Activate LawHub (not email copy) when coach invite is pending", async () => {
    getMyProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Ada Lovelace",
      first_name: "Ada",
      last_name: "Lovelace",
      phone: null,
      avatar_url: null,
      role: "student",
      student_coaching_id: "coach-1",
      is_first_time_login: false,
      created_at: "",
      updated_at: "",
    })
    getEntitlementState.mockResolvedValue({
      isAuthenticated: true,
      isLsacLinked: true,
      isLsacEligible: false,
      hasActiveCore: true,
      accessState: "FULL_ACCESS",
    })
    lawHubConfirmUrl.mockResolvedValue(
      "https://lawpath.azurewebsites.net/confirm_email?StudentCoachingId=coach-1&VendorId=BET2026",
    )

    renderPage()

    expect(await screen.findByRole("button", { name: "Activate LawHub" })).toBeInTheDocument()
    expect(screen.getByText(/coach invite created/i)).toBeInTheDocument()
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
    expect(screen.getByText(/open LSAC in a new tab/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Activate LawHub" }))
    expect(window.open).toHaveBeenCalledWith(
      "https://lawpath.azurewebsites.net/confirm_email?StudentCoachingId=coach-1&VendorId=BET2026",
      "_blank",
      "noopener,noreferrer",
    )
  })

  it("redirects to app when already LawHub eligible", async () => {
    getMyProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Ada Lovelace",
      first_name: "Ada",
      last_name: "Lovelace",
      phone: null,
      avatar_url: null,
      role: "student",
      student_coaching_id: "coach-1",
      is_first_time_login: false,
      created_at: "",
      updated_at: "",
    })
    getEntitlementState.mockResolvedValue({
      isAuthenticated: true,
      isLsacLinked: true,
      isLsacEligible: true,
      hasActiveCore: true,
      accessState: "FULL_ACCESS",
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("App home")).toBeInTheDocument()
    })
  })
})
