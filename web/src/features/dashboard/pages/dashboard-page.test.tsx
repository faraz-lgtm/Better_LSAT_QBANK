import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DashboardPage } from "@/features/dashboard/pages/dashboard-page"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import type { UserEntitlement } from "@/lib/api/users"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function paymentRequiredEntitlement(): UserEntitlement {
  return {
    isAuthenticated: true,
    isLsacLinked: false,
    isLsacEligible: false,
    hasActiveCore: false,
    accessState: "PAYMENT_REQUIRED",
  }
}

function fullAccessEntitlement(): UserEntitlement {
  return {
    isAuthenticated: true,
    isLsacLinked: true,
    isLsacEligible: true,
    hasActiveCore: true,
    accessState: "FULL_ACCESS",
  }
}

const mocks = vi.hoisted(() => ({
  entitlement: {
    entitlement: {
      isAuthenticated: true,
      isLsacLinked: false,
      isLsacEligible: false,
      hasActiveCore: false,
      accessState: "PAYMENT_REQUIRED" as "AUTH_REQUIRED" | "PAYMENT_REQUIRED" | "LSAC_REQUIRED" | "FULL_ACCESS",
    },
    loading: false,
    error: null as string | null,
    canAccessLsacContent: false,
    isPaymentRequired: true,
    isLsacSetupRequired: false,
    refresh: vi.fn(),
  },
  getMyProfile: vi.fn(),
  getStudyContext: vi.fn(),
  getOverview: vi.fn(),
  getSessions: vi.fn(),
  getPriorities: vi.fn(),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlement: () => mocks.entitlement,
}))

vi.mock("@/lib/api/users", () => ({
  createUsersApi: () => ({
    getMyProfile: mocks.getMyProfile,
    getStudyContext: mocks.getStudyContext,
    updateStudyPreferences: vi.fn(),
  }),
}))

vi.mock("@/lib/api/analytics", () => ({
  createAnalyticsApi: () => ({
    getOverview: mocks.getOverview,
    getSessions: mocks.getSessions,
    getPriorities: mocks.getPriorities,
  }),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => null,
}))

function renderDashboard() {
  return render(
    <MemoryRouter>
      <GuestPricingModalProvider>
        <DashboardPage />
      </GuestPricingModalProvider>
    </MemoryRouter>,
  )
}

function expectDashboardLoader() {
  expect(screen.getByRole("status")).toBeInTheDocument()
  expect(screen.getAllByText("Loading dashboard…").length).toBeGreaterThan(0)
}

describe("DashboardPage", () => {
  beforeEach(() => {
    mocks.entitlement.loading = false
    mocks.entitlement.canAccessLsacContent = false
    mocks.entitlement.isPaymentRequired = true
    mocks.entitlement.entitlement = paymentRequiredEntitlement()
    mocks.getMyProfile.mockResolvedValue({
      first_name: "Assad",
      last_name: "Siyal",
      full_name: "Assad Siyal",
    })
    mocks.getStudyContext.mockResolvedValue({ preferences: null, officialScores: [] })
    mocks.getOverview.mockResolvedValue({
      questionsAnswered: 0,
      accuracyPct: 0,
      studyMinutes: 0,
      predictedScore: null,
    })
    mocks.getSessions.mockResolvedValue({ sessions: [] })
    mocks.getPriorities.mockResolvedValue([])
  })

  it("shows the same Figma welcome heading as premium when LSAC content is locked", async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Assad" })).toBeInTheDocument()
      expect(screen.getByText("Choose a plan to continue")).toBeInTheDocument()
    })
  })

  it("keeps the loader up until dashboard data arrives instead of flashing empty drills", async () => {
    mocks.entitlement.canAccessLsacContent = true
    mocks.entitlement.isPaymentRequired = false
    mocks.entitlement.entitlement = fullAccessEntitlement()

    const overview = deferred<Record<string, unknown>>()
    mocks.getOverview.mockReturnValue(overview.promise)
    mocks.getSessions.mockReturnValue(new Promise(() => undefined))
    mocks.getPriorities.mockReturnValue(new Promise(() => undefined))
    mocks.getStudyContext.mockReturnValue(new Promise(() => undefined))
    mocks.getMyProfile.mockReturnValue(new Promise(() => undefined))

    renderDashboard()

    expectDashboardLoader()
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Welcome back/ })).not.toBeInTheDocument()

    overview.resolve({
      questionsAnswered: 0,
      accuracyPct: 0,
      studyMinutes: 0,
      predictedScore: null,
    })
    await waitFor(() => {
      expectDashboardLoader()
    })
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()
  })

  it("does not clear the loader when entitlement flips to premium before a stale fetch finishes", async () => {
    mocks.entitlement.loading = true
    mocks.entitlement.canAccessLsacContent = false

    const profile = deferred<{ first_name: string }>()
    mocks.getMyProfile.mockReturnValue(profile.promise)
    mocks.getOverview.mockReturnValue(new Promise(() => undefined))
    mocks.getSessions.mockReturnValue(new Promise(() => undefined))
    mocks.getPriorities.mockReturnValue(new Promise(() => undefined))
    mocks.getStudyContext.mockReturnValue(new Promise(() => undefined))

    const view = renderDashboard()
    expectDashboardLoader()

    mocks.entitlement.loading = false
    mocks.entitlement.canAccessLsacContent = true
    mocks.entitlement.isPaymentRequired = false
    view.rerender(
      <MemoryRouter>
        <GuestPricingModalProvider>
          <DashboardPage />
        </GuestPricingModalProvider>
      </MemoryRouter>,
    )

    expectDashboardLoader()
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()

    profile.resolve({ first_name: "Assad" })
    await waitFor(() => {
      expectDashboardLoader()
    })
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /Welcome back/ })).not.toBeInTheDocument()
  })
})
