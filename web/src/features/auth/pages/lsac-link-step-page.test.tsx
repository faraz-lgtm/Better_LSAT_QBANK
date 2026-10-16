import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LsacLinkStepPage } from "./lsac-link-step-page"

const PROD_CONFIRM_URL =
  "https://app.lawhub.org/confirm_email?StudentCoachingId=coach-1&VendorId=BET2026"

const getMyProfile = vi.fn()
const getEntitlementState = vi.fn()
const lawHubConfirmUrl = vi.fn()
const lawHubRefresh = vi.fn()
const lawHubLink = vi.fn()
const lawHubLogLogin = vi.fn()
const pollEntitlementMock = vi.fn()

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

vi.mock("@/features/app-shell/poll-entitlement-after-checkout", () => ({
  pollEntitlementAfterCheckoutSuccess: (...args: unknown[]) => pollEntitlementMock(...args),
}))

const unpaidEntitlement = {
  isAuthenticated: true,
  isLsacLinked: false,
  isLsacEligible: false,
  hasActiveCore: false,
  accessState: "PAYMENT_REQUIRED" as const,
}

const paidNeedsLsacEntitlement = {
  isAuthenticated: true,
  isLsacLinked: false,
  isLsacEligible: false,
  hasActiveCore: true,
  accessState: "LSAC_REQUIRED" as const,
}

const baseProfile = {
  id: "u1",
  email: "a@b.com",
  full_name: "Ada Lovelace",
  first_name: "Ada",
  last_name: "Lovelace",
  phone: null,
  avatar_url: null,
  role: "student" as const,
  student_coaching_id: null,
  is_first_time_login: false,
  created_at: "",
  updated_at: "",
}

function renderPage(initialEntry = "/app/lsac-link-step") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/lsac-link-step" element={<LsacLinkStepPage />} />
        <Route path="/app" element={<div>App home</div>} />
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
    pollEntitlementMock.mockReset()
    pollEntitlementMock.mockResolvedValue(false)
    vi.stubGlobal("open", vi.fn())
    vi.stubGlobal("location", {
      ...window.location,
      assign: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("shows path instructions and labels on the invite step", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(paidNeedsLsacEntitlement)

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
      ...baseProfile,
      student_coaching_id: "coach-1",
    })
    getEntitlementState.mockResolvedValue({
      ...paidNeedsLsacEntitlement,
      isLsacLinked: true,
      accessState: "FULL_ACCESS",
    })
    lawHubConfirmUrl.mockResolvedValue(PROD_CONFIRM_URL)

    renderPage()

    expect(await screen.findByRole("button", { name: "Activate LawHub" })).toBeInTheDocument()
    expect(screen.getByText(/coach invite created/i)).toBeInTheDocument()
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
    expect(screen.getByText(/open LSAC in a new tab/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Activate LawHub" }))
    expect(window.open).toHaveBeenCalledWith(PROD_CONFIRM_URL, "_blank", "noopener,noreferrer")
  })

  it("shows linked popup and hard-refreshes to /app after 10s when LawHub becomes eligible", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    getMyProfile.mockResolvedValue({
      ...baseProfile,
      student_coaching_id: "coach-1",
    })
    getEntitlementState
      .mockResolvedValueOnce({
        ...paidNeedsLsacEntitlement,
        isLsacLinked: true,
        accessState: "FULL_ACCESS",
      })
      .mockResolvedValue({
        isAuthenticated: true,
        isLsacLinked: true,
        isLsacEligible: true,
        hasActiveCore: true,
        accessState: "FULL_ACCESS",
      })
    lawHubConfirmUrl.mockResolvedValue(PROD_CONFIRM_URL)
    lawHubRefresh.mockResolvedValue(undefined)

    renderPage()

    expect(await screen.findByRole("button", { name: "I've finished on LawHub" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "I've finished on LawHub" }))

    expect(await screen.findByRole("heading", { name: /you're linked/i })).toBeInTheDocument()
    expect(window.location.assign).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(window.location.assign).toHaveBeenCalledWith("/app")
  })

  it("redirects to app when already LawHub eligible", async () => {
    getMyProfile.mockResolvedValue({
      ...baseProfile,
      student_coaching_id: "coach-1",
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

  it("redirects unpaid users without checkout success to app with upgrade handoff", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("App home")).toBeInTheDocument()
    })
    expect(pollEntitlementMock).not.toHaveBeenCalled()
  })

  it("shows pending LawHub setup UI for free accounts with preview=1", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)

    renderPage("/app/lsac-link-step?preview=1")

    expect(await screen.findByRole("button", { name: "Activate LawHub" })).toBeInTheDocument()
    expect(screen.getByText(/coach invite created/i)).toBeInTheDocument()
    expect(screen.queryByText("App home")).not.toBeInTheDocument()
  })

  it("shows invite step UI for free accounts with preview=invite", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)

    renderPage("/app/lsac-link-step?preview=invite")

    expect(await screen.findByText(/choose one path/i)).toBeInTheDocument()
    expect(screen.queryByText("App home")).not.toBeInTheDocument()
  })

  it("shows pending LawHub setup UI for free accounts with preview=1", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)

    renderPage("/app/lsac-link-step?preview=1")

    expect(await screen.findByRole("button", { name: "Activate LawHub" })).toBeInTheDocument()
    expect(screen.getByText(/coach invite created/i)).toBeInTheDocument()
    expect(screen.queryByText("App home")).not.toBeInTheDocument()
  })

  it("shows invite step UI for free accounts with preview=invite", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)

    renderPage("/app/lsac-link-step?preview=invite")

    expect(await screen.findByText(/choose one path/i)).toBeInTheDocument()
    expect(screen.queryByText("App home")).not.toBeInTheDocument()
  })

  it("waits for webhook after checkout success before showing LawHub setup", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState
      .mockResolvedValueOnce(unpaidEntitlement)
      .mockResolvedValue(paidNeedsLsacEntitlement)
    pollEntitlementMock.mockResolvedValue(true)

    renderPage("/app/lsac-link-step?checkout=success")

    expect(await screen.findByText(/choose one path/i)).toBeInTheDocument()
    expect(pollEntitlementMock).toHaveBeenCalled()
    expect(screen.queryByText("App home")).not.toBeInTheDocument()
  })

  it("sends checkout success users to app with upgrade handoff only after entitlement poll times out", async () => {
    getMyProfile.mockResolvedValue(baseProfile)
    getEntitlementState.mockResolvedValue(unpaidEntitlement)
    pollEntitlementMock.mockResolvedValue(false)

    renderPage("/app/lsac-link-step?checkout=success")

    await waitFor(() => {
      expect(screen.getByText("App home")).toBeInTheDocument()
    })
    expect(pollEntitlementMock).toHaveBeenCalled()
  })
})
