import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  FREE_START_FULL_HREF,
  FREE_START_MINI_HREF,
  FreePlanDashboard,
} from "@/features/dashboard/components/free-plan-dashboard"
import { GuestPricingModalProvider } from "@/features/guest/pricing/guest-pricing-modal-provider"
import {
  DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY,
  type GuestDiagnosticResult,
} from "@/features/guest/diagnostic/guest-diagnostic-result-storage"

const openPricingModal = vi.fn()

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", async () => {
  const actual = await vi.importActual<typeof import("@/features/guest/pricing/guest-pricing-modal-provider")>(
    "@/features/guest/pricing/guest-pricing-modal-provider",
  )
  return {
    ...actual,
    useGuestPricingModal: () => ({
      openPricingModal,
      openLockedContentModal: vi.fn(),
      closePricingModal: vi.fn(),
    }),
  }
})

function sampleAttempt(overrides: Partial<GuestDiagnosticResult> = {}): GuestDiagnosticResult {
  return {
    id: "attempt-1",
    intentId: "quick",
    completedAt: "2026-10-08T12:00:00.000Z",
    diagnosticNumber: 1,
    scaledScore: 122,
    scaledScoreLow: 120,
    scaledScoreHigh: 124,
    scaledScoreLabel: "120–124",
    percentile: 1,
    percentileLow: 1,
    percentileHigh: 2,
    percentileLabel: "1st–2nd",
    correctCount: 0,
    questionCount: 25,
    outcomes: [],
    ...overrides,
  }
}

function renderFreeDashboard(firstName = "Daniyal") {
  return render(
    <MemoryRouter>
      <GuestPricingModalProvider>
        <FreePlanDashboard firstName={firstName} />
      </GuestPricingModalProvider>
    </MemoryRouter>,
  )
}

describe("FreePlanDashboard", () => {
  beforeEach(() => {
    openPricingModal.mockReset()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it("renders the Figma free-plan welcome, upgrade banner, and diagnostic CTAs", () => {
    renderFreeDashboard()

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back, Daniyal" })).toBeInTheDocument()
    expect(
      screen.getByText("Take a free diagnostic to see which question types are costing you the most points."),
    ).toBeInTheDocument()
    expect(screen.getByText("Unlock full practice and analytics")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Compare Plans" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Start a diagnostic" })).toBeInTheDocument()

    const fullLink = screen.getByRole("link", { name: /Start full section/i })
    const miniLink = screen.getByRole("link", { name: "Start mini" })
    expect(fullLink).toHaveAttribute("href", FREE_START_FULL_HREF)
    expect(miniLink).toHaveAttribute("href", FREE_START_MINI_HREF)
  })

  it("opens the pricing modal from Compare Plans", async () => {
    const user = userEvent.setup()
    renderFreeDashboard()

    await user.click(screen.getByRole("button", { name: "Compare Plans" }))
    expect(openPricingModal).toHaveBeenCalledTimes(1)
  })

  it("shows locked analytics teasers with blurred placeholder values", () => {
    renderFreeDashboard()

    expect(screen.getByText("Total Study Time")).toBeInTheDocument()
    expect(screen.getByText("Performance Overview")).toBeInTheDocument()
    expect(screen.getByText("Across 50 practice tests")).toBeInTheDocument()
    expect(screen.getByText("142h").className).toMatch(/blur-\[7px\]/)
    expect(screen.getByText("169").className).toMatch(/blur-\[7px\]/)
  })

  it("lists diagnostic history and filters by kind", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      DIAGNOSTIC_ATTEMPT_HISTORY_STORAGE_KEY,
      JSON.stringify([
        sampleAttempt(),
        sampleAttempt({
          id: "attempt-2",
          intentId: "mini",
          diagnosticNumber: 1,
          questionCount: 10,
          correctCount: 3,
          scaledScoreLabel: "145–149",
        }),
      ]),
    )

    renderFreeDashboard()

    expect(screen.getByText("Full section diagnostic #1")).toBeInTheDocument()
    expect(screen.getByText("Mini diagnostic #1")).toBeInTheDocument()

    const tablist = screen.getByRole("tablist", { name: "Filter diagnostics" })
    await user.click(within(tablist).getByRole("tab", { name: "Mini" }))

    expect(screen.queryByText("Full section diagnostic #1")).not.toBeInTheDocument()
    expect(screen.getByText("Mini diagnostic #1")).toBeInTheDocument()

    await user.click(within(tablist).getByRole("tab", { name: "Full section" }))
    expect(screen.getByText("Full section diagnostic #1")).toBeInTheDocument()
    expect(screen.queryByText("Mini diagnostic #1")).not.toBeInTheDocument()
  })
})
