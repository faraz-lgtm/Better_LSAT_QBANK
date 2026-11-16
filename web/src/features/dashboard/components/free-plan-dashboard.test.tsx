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
import { STUDENT_FREE_STRATEGY_CALL_HREF, STUDENT_TUTORING_BOOK_HREF } from "@/features/app-shell/student-nav-config"
import { PREP_COURSE_ESSENTIALS_SLUG } from "@/features/prep-course/lib/prep-course-nav"

const openPricingModal = vi.fn()
const openLockedContentModal = vi.fn()

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", async () => {
  const actual = await vi.importActual<typeof import("@/features/guest/pricing/guest-pricing-modal-provider")>(
    "@/features/guest/pricing/guest-pricing-modal-provider",
  )
  return {
    ...actual,
    useGuestPricingModal: () => ({
      openPricingModal,
      openLockedContentModal,
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
    openLockedContentModal.mockReset()
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
    expect(
      screen.getByText("Choose the access period that fits your prep timeline. Your tools stay the same."),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Compare Plans" }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole("heading", { name: "Start a diagnostic" })).toBeInTheDocument()

    const fullLink = screen.getByRole("link", { name: /Start full section/i })
    const miniLink = screen.getByRole("link", { name: /Start mini/i })
    expect(fullLink).toHaveAttribute("href", FREE_START_FULL_HREF)
    expect(miniLink).toHaveAttribute("href", FREE_START_MINI_HREF)
    expect(screen.getByText("Quick baseline")).toBeInTheDocument()
    expect(screen.getByText("Deeper performance view")).toBeInTheDocument()
    expect(screen.getByText("Recommended")).toBeInTheDocument()
  })

  it("renders tutoring upsell, continue learning, transcripts, and LSAC license", () => {
    renderFreeDashboard()

    expect(screen.getByText("You haven't booked a session yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Book My Free Strategy Call" })).toHaveAttribute(
      "href",
      STUDENT_FREE_STRATEGY_CALL_HREF,
    )
    expect(screen.getByRole("heading", { name: "Continue learning" })).toBeInTheDocument()
    expect(screen.getByText("LSAT Essentials Course")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Start course/i })).toHaveAttribute(
      "href",
      `/app/prep-course/${PREP_COURSE_ESSENTIALS_SLUG}`,
    )
    expect(screen.getByText("No session transcripts yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Book Your First Session" })).toHaveAttribute(
      "href",
      STUDENT_TUTORING_BOOK_HREF,
    )
  })

  it("opens the pricing modal from Compare Plans and locked modules", async () => {
    const user = userEvent.setup()
    renderFreeDashboard()

    await user.click(screen.getAllByRole("button", { name: "Compare Plans" })[0])
    expect(openPricingModal).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole("button", { name: /The LSAT Language/i }))
    expect(openLockedContentModal).toHaveBeenCalledWith("courses")
  })

  it("shows locked analytics teasers with empty placeholders (no metric text)", () => {
    renderFreeDashboard()

    expect(screen.getByText("Total Study Time")).toBeInTheDocument()
    expect(screen.getByText("Performance Overview")).toBeInTheDocument()
    expect(screen.queryByText("Per question")).not.toBeInTheDocument()

    // No fake placeholders that look like real data.
    expect(screen.queryByText("Across 50 practice tests")).not.toBeInTheDocument()
    expect(screen.queryByText("+14 this week")).not.toBeInTheDocument()
    expect(screen.queryByText("Needs improvement")).not.toBeInTheDocument()

    const skeletons = screen.getAllByTestId("locked-metric-skeleton")
    expect(skeletons).toHaveLength(10)
    for (const skeleton of skeletons) {
      expect(skeleton.textContent).toBe("")
    }

    // No numeric teaser values in the DOM — placeholders must reveal nothing.
    expect(screen.queryByText("142h")).not.toBeInTheDocument()
    expect(screen.queryByText("169")).not.toBeInTheDocument()
    expect(screen.queryByText("98th")).not.toBeInTheDocument()
    expect(screen.queryByText("64%")).not.toBeInTheDocument()
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
