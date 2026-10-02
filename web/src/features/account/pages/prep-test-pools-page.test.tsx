import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { PrepTestPoolsPage } from "@/features/account/pages/prep-test-pools-page"
import { ThemeProvider } from "@/features/theme/theme-provider"

const { listPrepTestPoolSettings, updatePrepTestPoolSettings, resetPrepTestPoolSettings } = vi.hoisted(() => ({
  listPrepTestPoolSettings: vi.fn(),
  updatePrepTestPoolSettings: vi.fn(),
  resetPrepTestPoolSettings: vi.fn(),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    listPrepTestPoolSettings,
    updatePrepTestPoolSettings,
    resetPrepTestPoolSettings,
  }),
}))

vi.mock("@/features/student/accommodations/accommodations-context", () => ({
  useAccommodations: () => ({
    extraTimeSetting: "none",
    extraTimeCustomMinutes: null,
    updateAccommodations: vi.fn(),
    scaleFactor: 1,
    sectionTimerSeconds: 35 * 60,
  }),
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlement: () => ({
    entitlement: { hasActiveCore: false, accessState: "LIMITED" },
    loading: false,
  }),
}))

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", () => ({
  useGuestPricingModal: () => ({
    openPricingModal: vi.fn(),
  }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <PrepTestPoolsPage />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe("PrepTestPoolsPage", () => {
  it("renders pool toggles and resets to defaults", async () => {
    const user = userEvent.setup()
    listPrepTestPoolSettings.mockResolvedValue({
      prepTests: [
        {
          prepTestId: "pt-120",
          moduleId: "LSAC120",
          prepTestNumber: "120",
          title: null,
          inDrills: true,
          inSections: false,
          inTests: false,
          freshnessPercent: 88,
          isDefault: true,
        },
      ],
      counts: { drills: 1, sections: 0, tests: 0 },
    })
    resetPrepTestPoolSettings.mockResolvedValue({
      prepTests: [
        {
          prepTestId: "pt-120",
          moduleId: "LSAC120",
          prepTestNumber: "120",
          title: null,
          inDrills: true,
          inSections: false,
          inTests: false,
          freshnessPercent: 88,
          isDefault: true,
        },
      ],
      counts: { drills: 1, sections: 0, tests: 0 },
    })

    renderPage()

    expect(await screen.findByText("PT120")).toBeInTheDocument()
    expect(screen.getByText("88%")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Setting" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Accommodations" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "PrepTest Setting" })).toBeInTheDocument()
    expect(screen.getByText("Current Plan")).toBeInTheDocument()
    expect(screen.getByText("Standard (35 min)")).toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "Dark mode" })).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Settings" })).not.toBeInTheDocument()
    expect(screen.getByRole("switch", { name: "PT120 drills" })).toBeChecked()
    expect(screen.getByRole("switch", { name: "PT120 sections" })).not.toBeChecked()
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reset to defaults" }))
    await waitFor(() => {
      expect(resetPrepTestPoolSettings).toHaveBeenCalled()
    })
    expect(await screen.findByText("Allocation updated.")).toBeInTheDocument()
  })

  it("shows Allocation updated toast after toggle save", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    listPrepTestPoolSettings.mockResolvedValue({
      prepTests: [
        {
          prepTestId: "pt-120",
          moduleId: "LSAC120",
          prepTestNumber: "120",
          title: null,
          inDrills: true,
          inSections: false,
          inTests: false,
          freshnessPercent: 88,
          isDefault: true,
        },
      ],
      counts: { drills: 1, sections: 0, tests: 0 },
    })
    updatePrepTestPoolSettings.mockResolvedValue({
      prepTests: [
        {
          prepTestId: "pt-120",
          moduleId: "LSAC120",
          prepTestNumber: "120",
          title: null,
          inDrills: true,
          inSections: true,
          inTests: false,
          freshnessPercent: 88,
          isDefault: false,
        },
      ],
      counts: { drills: 1, sections: 1, tests: 0 },
    })

    renderPage()

    expect(await screen.findByRole("switch", { name: "PT120 sections" })).toBeInTheDocument()
    await user.click(screen.getByRole("switch", { name: "PT120 sections" }))
    await vi.advanceTimersByTimeAsync(500)

    await waitFor(() => {
      expect(updatePrepTestPoolSettings).toHaveBeenCalled()
    })
    expect(await screen.findByText("Allocation updated.")).toBeInTheDocument()
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})
