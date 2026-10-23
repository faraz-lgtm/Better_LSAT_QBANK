import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { GuestDiagnosticResultsView } from "@/features/guest/diagnostic/guest-diagnostic-results-view"
import { buildDefaultGuestDiagnosticResult } from "@/features/guest/diagnostic/guest-diagnostic-result-storage"
import { getDiagnosticQuestionMeta } from "@/features/guest/diagnostic/mini-diagnostic-content"

const subscription = vi.hoisted(() => ({
  hasActiveCore: false,
  loading: false,
  error: null as string | null,
  refresh: () => {},
}))

const ensureStudyContext = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ preferences: { goalScore: null } }),
)

vi.mock("@/features/guest/diagnostic/use-diagnostic-subscription", () => ({
  useDiagnosticSubscription: () => subscription,
}))

vi.mock("@/features/student-session/ensure-student-session", () => ({
  ensureStudyContext: () => ensureStudyContext(),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

describe("GuestDiagnosticResultsView Section diagnostic", () => {
  it("shows 5 Full Section rows collapsed with report sections visible, then See All reveals locked teasers only", async () => {
    const user = userEvent.setup()
    subscription.hasActiveCore = false
    ensureStudyContext.mockResolvedValue({ preferences: { goalScore: null } })
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Full Section question 5/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full Section question 6/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()
    expect(screen.getByText("Early performance signals")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "See All" }))

    expect(screen.getByLabelText(/Full Section question 10/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Section question 6/i)).toBeInTheDocument()
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
    expect(screen.getByText("You've reached your free analytics limit!")).toBeInTheDocument()
    expect(screen.getByText("Early performance signals")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "See less" })).toBeInTheDocument()

    const lockedRows = screen.getAllByTestId("diagnostic-locked-question-row")
    expect(lockedRows.length).toBeGreaterThan(0)

    // Real Q11 type must not appear in locked teasers (dummy only).
    const realQ11Type = getDiagnosticQuestionMeta("section-diag-q11", "quick")?.questionType
    expect(realQ11Type).toBeTruthy()
    for (const row of lockedRows) {
      expect(row.textContent).not.toContain(realQ11Type!)
    }
  })

  it("keeps all section rows unlocked for premium students and still collapses to 5 with See All", async () => {
    const user = userEvent.setup()
    subscription.hasActiveCore = true
    ensureStudyContext.mockResolvedValue({ preferences: { goalScore: 170 } })
    const result = buildDefaultGuestDiagnosticResult("quick")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Full Section question 5/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full Section question 11/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.queryByRole("button", { name: "Subscribe" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "See All" }))

    expect(screen.getByLabelText(/Full Section question 11/i)).toBeInTheDocument()
    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.queryByText("Take your first full preptest to track progress")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Set My Goal Score" })).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "See less" })).toBeInTheDocument()
  })
})

describe("GuestDiagnosticResultsView Mini teaser", () => {
  it("shows 3 Mini rows collapsed with report sections visible, then See All reveals Q4–Q5 and locked teasers only", async () => {
    const user = userEvent.setup()
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("mini")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Mini question 3/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Mini question 4/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Mini question 5/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("diagnostic-locked-question-row")).toBeNull()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()
    expect(screen.getByText("Early performance signals")).toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "See All" }))

    expect(screen.getByLabelText(/Mini question 5/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBe(5)
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Full Access" })).toBeInTheDocument()
    expect(screen.getByText("Early performance signals")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "See less" })).toBeInTheDocument()

    const realQ6Type = getDiagnosticQuestionMeta("mini-diag-q6", "mini")?.questionType
    expect(realQ6Type).toBeTruthy()
    for (const row of screen.getAllByTestId("diagnostic-locked-question-row")) {
      expect(row.textContent).not.toContain(realQ6Type!)
    }
  })
})

describe("GuestDiagnosticResultsView Full teaser", () => {
  it("shows 5 Full Section rows collapsed, then See All reveals locked teasers under the limit overlay", async () => {
    const user = userEvent.setup()
    subscription.hasActiveCore = false
    const result = buildDefaultGuestDiagnosticResult("full")
    render(
      <MemoryRouter>
        <GuestDiagnosticResultsView result={result} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/Full Section question 5/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Full Section question 10/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-free-analytics-limit-cta")).not.toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "See All" }))

    expect(screen.getByLabelText(/Full Section question 10/i)).toBeInTheDocument()
    expect(screen.getAllByTestId("diagnostic-locked-question-row").length).toBeGreaterThan(0)
    expect(screen.getByTestId("guest-free-analytics-limit-cta")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "See less" })).toBeInTheDocument()
  })
})
