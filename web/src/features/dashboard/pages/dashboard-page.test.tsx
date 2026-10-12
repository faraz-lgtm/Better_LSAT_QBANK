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
  getTrajectory: vi.fn(),
  getSessions: vi.fn(),
  getPriorities: vi.fn(),
  getPageBundle: vi.fn(),
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
    getTrajectory: mocks.getTrajectory,
    getSessions: mocks.getSessions,
    getPriorities: mocks.getPriorities,
    getPageBundle: mocks.getPageBundle,
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
    mocks.getTrajectory.mockResolvedValue([])
    mocks.getSessions.mockResolvedValue({ sessions: [] })
    mocks.getPriorities.mockResolvedValue([])
    mocks.getPageBundle.mockResolvedValue({
      view: "dashboard",
      overview: {
        bestScaledScore: null,
        averageScaledScore: null,
        bestPercentile: null,
        averagePercentile: null,
        completedPrepTestCount: 0,
        totalQuestionsAnswered: 0,
        drillAccuracyPct: null,
        totalDrillQuestionsAnswered: 0,
        averageLrMissedPerPrepTest: null,
        averageRcMissedPerPrepTest: null,
        totalStudyMinutes: 0,
      },
      trajectory: [],
      sessions: { sessions: [], total: 0, limit: 12, offset: 0 },
      priorities: [],
    })
  })

  it("shows the free-plan dashboard when payment is required", async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Assad" })).toBeInTheDocument()
      expect(screen.getByText("Unlock full practice and analytics")).toBeInTheDocument()
      expect(screen.getByRole("heading", { name: "Start a diagnostic" })).toBeInTheDocument()
      expect(screen.queryByText("Choose a plan to continue")).not.toBeInTheDocument()
    })
  })

  it("shows LawHub setup when payment is settled but LSAC content is still locked", async () => {
    mocks.entitlement.isPaymentRequired = false
    mocks.entitlement.entitlement = {
      ...paymentRequiredEntitlement(),
      accessState: "LSAC_REQUIRED",
      hasActiveCore: true,
    }

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Assad" })).toBeInTheDocument()
      expect(screen.getByRole("heading", { level: 2, name: "Complete LawHub setup" })).toBeInTheDocument()
    })
  })

  it("paints the shell while analytics is still loading (no full-page loader)", async () => {
    mocks.entitlement.canAccessLsacContent = true
    mocks.entitlement.isPaymentRequired = false
    mocks.entitlement.entitlement = fullAccessEntitlement()

    const bundle = deferred<{
      view: string
      overview: Record<string, unknown>
      trajectory: unknown[]
      sessions: { sessions: unknown[]; total: number; limit: number; offset: number }
      priorities: unknown[]
    }>()
    mocks.getPageBundle.mockReturnValue(bundle.promise)
    mocks.getStudyContext.mockResolvedValue({
      preferences: { plannedLsatDate: "2026-10-01", plannedLsatWindow: null },
      officialScores: [],
    })
    mocks.getMyProfile.mockResolvedValue({ first_name: "Assad", full_name: "Assad Siyal" })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /Welcome back/ })).toBeInTheDocument()
    })
    expect(screen.queryByText("Loading dashboard…")).not.toBeInTheDocument()
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()
    expect(screen.getByLabelText("Loading stats")).toBeInTheDocument()
    expect(screen.getByLabelText("Loading drills")).toBeInTheDocument()

    bundle.resolve({
      view: "dashboard",
      overview: {
        bestScaledScore: 170,
        averageScaledScore: 160,
        bestPercentile: 90,
        averagePercentile: 80,
        completedPrepTestCount: 2,
        totalQuestionsAnswered: 100,
        drillAccuracyPct: 75,
        totalDrillQuestionsAnswered: 40,
        averageLrMissedPerPrepTest: 3,
        averageRcMissedPerPrepTest: 4,
        totalStudyMinutes: 120,
      },
      trajectory: [],
      sessions: { sessions: [], total: 0, limit: 12, offset: 0 },
      priorities: [],
    })

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stats")).not.toBeInTheDocument()
      expect(screen.getByText(/No drills in progress/)).toBeInTheDocument()
    })
  })

  it("updates the welcome name as soon as profile resolves, even if study context is slow", async () => {
    mocks.entitlement.canAccessLsacContent = true
    mocks.entitlement.isPaymentRequired = false
    mocks.entitlement.entitlement = fullAccessEntitlement()

    const profile = deferred<{ first_name: string }>()
    mocks.getMyProfile.mockReturnValue(profile.promise)
    mocks.getStudyContext.mockReturnValue(new Promise(() => undefined))
    mocks.getPageBundle.mockReturnValue(new Promise(() => undefined))

    renderDashboard()

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading stats")).toBeInTheDocument()

    profile.resolve({ first_name: "Assad" })
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Assad" })).toBeInTheDocument()
    })
    expect(screen.getByLabelText("Loading stats")).toBeInTheDocument()
    expect(screen.queryByText(/No drills in progress/)).not.toBeInTheDocument()
  })
})
