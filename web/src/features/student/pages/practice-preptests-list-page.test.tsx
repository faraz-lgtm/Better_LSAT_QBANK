import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PracticePrepTestsListPage } from "@/features/student/pages/practice-preptests-list-page"
import { clearPrepTestPoolCache } from "@/features/student/preptests/prep-test-pool-cache"
import type { PrepTestPoolItem, PrepTestPoolSort } from "@/features/student/preptests/preptest-types"

const { listPrepTestPool, entitlementMock, openLockedContentModal } = vi.hoisted(() => ({
  listPrepTestPool: vi.fn(),
  openLockedContentModal: vi.fn(),
  entitlementMock: {
    entitlement: {
      hasActiveCore: false,
      accessState: "FULL_ACCESS" as "FULL_ACCESS" | "PAYMENT_REQUIRED",
    },
    isPaymentRequired: false,
  },
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({}),
}))

vi.mock("@/lib/api/practice", () => ({
  createPracticeApi: () => ({
    listPrepTestPool,
    startPrepTest: vi.fn(),
    startBlindReview: vi.fn(),
    getBlindReviewDetail: vi.fn(),
    prefetchPrepTestDetail: vi.fn(),
  }),
}))

vi.mock("@/features/app-shell/student-entitlement-context", () => ({
  useStudentEntitlementOptional: () => entitlementMock,
}))

vi.mock("@/features/guest/pricing/guest-pricing-modal-provider", () => ({
  useGuestPricingModal: () => ({
    openPricingModal: vi.fn(),
    openLockedContentModal,
    closePricingModal: vi.fn(),
  }),
}))

function poolItem(id: string, number: string, overrides: Partial<PrepTestPoolItem> = {}): PrepTestPoolItem {
  return {
    id,
    moduleId: `LSAC${number}`,
    title: `PrepTest ${number}`,
    prepTestNumber: number,
    questionCount: 5,
    sectionCount: 2,
    practiceableSectionCount: 2,
    timeMinutes: 70,
    status: "fresh",
    scaledScore: null,
    blindReviewScaledScore: null,
    blindReviewStatus: null,
    completedAt: null,
    attempts: [],
    openPrepTestSessionId: null,
    inDrills: true,
    inSections: true,
    inTests: true,
    ...overrides,
  }
}

const newestFirst = [poolItem("pt-901", "901"), poolItem("pt-900", "900")]
const oldestFirst = [poolItem("pt-900", "900"), poolItem("pt-901", "901")]

function mockPool(sort: PrepTestPoolSort = "newest") {
  listPrepTestPool.mockImplementation((input: { sort?: PrepTestPoolSort; pageSize?: number } = {}) => {
    const requested = input.sort === "oldest" ? "oldest" : sort
    const prepTests = requested === "oldest" ? oldestFirst : newestFirst
    return Promise.resolve({
      prepTests,
      total: prepTests.length,
      page: 1,
      pageSize: input.pageSize ?? 5,
      statusCounts: { all: 2, fresh: 2, in_progress: 0, completed: 0, blind_review: 0 },
    })
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PracticePrepTestsListPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  clearPrepTestPoolCache()
  listPrepTestPool.mockReset()
  openLockedContentModal.mockReset()
  entitlementMock.entitlement.hasActiveCore = false
  entitlementMock.entitlement.accessState = "FULL_ACCESS"
  entitlementMock.isPaymentRequired = false
})

describe("PracticePrepTestsListPage loading shell", () => {
  it("paints the page chrome with skeletons while the pool is loading", async () => {
    let resolvePool: ((value: unknown) => void) | undefined
    listPrepTestPool.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePool = resolve
        }),
    )
    renderPage()

    expect(screen.getByText(/all official Prep Tests from the Law School Admission Council/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Start your PrepTest" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All Test" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "In Progress" })).toBeInTheDocument()
    expect(screen.getByLabelText("Loading PrepTests")).toBeInTheDocument()
    expect(screen.queryByText("Loading PrepTests…")).not.toBeInTheDocument()

    resolvePool?.({
      prepTests: newestFirst,
      total: newestFirst.length,
      page: 1,
      pageSize: 5,
      statusCounts: { all: 2, fresh: 2, in_progress: 0, completed: 0, blind_review: 0 },
    })

    expect(await screen.findByTestId("preptest-list-row-pt-901")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "In Progress (0)" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Loading PrepTests")).not.toBeInTheDocument()
  })
})

describe("PracticePrepTestsListPage sort", () => {
  it("does not show a PrepTest settings control on the list page", async () => {
    mockPool("newest")
    renderPage()
    expect(await screen.findByTestId("preptest-list-row-pt-901")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /PrepTest settings/i })).not.toBeInTheDocument()
  })

  it("reloads the pool from Oldest to Newest when the sort control changes", async () => {
    const user = userEvent.setup()
    mockPool("newest")
    renderPage()

    expect(await screen.findByTestId("preptest-list-row-pt-901")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "All Test" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "In Progress (0)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fresh (2)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Completed (0)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Untimed Review" })).toBeInTheDocument()
    expect(screen.getAllByText("Ready to Take")).toHaveLength(2)
    expect(screen.getByText("901").closest("[data-pt-badge]")?.className).toMatch(/size-12/)
    expect(screen.getByText("901").closest("[data-pt-badge]")?.className).toMatch(/md:size-16/)
    expect(screen.getByTestId("preptest-list-row-pt-901").className).toMatch(/bg-\[var\(--greyscale-0\)\]/)
    expect(screen.getByTestId("preptest-list-row-pt-901").className).toMatch(/hover:bg-\[var\(--primary-25\)\]/)
    expect(screen.getByTestId("preptest-list-row-pt-901").className).toMatch(/hover:border-\[var\(--primary\)\]/)
    expect(screen.queryByRole("button", { name: /^Start$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "In Process" })).not.toBeInTheDocument()
    const rows = screen.getAllByTestId(/preptest-list-row-/)
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "preptest-list-row-pt-901",
      "preptest-list-row-pt-900",
    ])

    await user.click(screen.getByRole("button", { name: "Sort PrepTests" }))
    await user.click(screen.getByRole("option", { name: "Oldest" }))

    await waitFor(() => {
      expect(listPrepTestPool).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "oldest", page: 1, pageSize: 5 }),
      )
    })
    await waitFor(() => {
      expect(screen.getAllByTestId(/preptest-list-row-/).map((row) => row.getAttribute("data-testid"))).toEqual([
        "preptest-list-row-pt-900",
        "preptest-list-row-pt-901",
      ])
    })
  })
})

describe("PracticePrepTestsListPage see more", () => {
  it("loads the full PrepTest pool across capped pages when See more is clicked", async () => {
    const user = userEvent.setup()
    const allItems = Array.from({ length: 55 }, (_, i) => {
      const n = 955 - i
      return poolItem(`pt-${n}`, String(n))
    })
    listPrepTestPool.mockImplementation((input: { page?: number; pageSize?: number } = {}) => {
      const page = input.page ?? 1
      const pageSize = input.pageSize ?? 5
      const start = (page - 1) * pageSize
      return Promise.resolve({
        prepTests: allItems.slice(start, start + pageSize),
        total: allItems.length,
        page,
        pageSize,
        statusCounts: {
          all: allItems.length,
          fresh: allItems.length,
          in_progress: 0,
          completed: 0,
          blind_review: 0,
        },
      })
    })

    renderPage()

    expect(await screen.findByTestId("preptest-list-row-pt-955")).toBeInTheDocument()
    expect(screen.getAllByTestId(/preptest-list-row-/)).toHaveLength(5)
    expect(screen.queryByTestId("preptest-list-row-pt-901")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "See more" }))

    await waitFor(() => {
      expect(listPrepTestPool).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 50, sort: "newest" }),
      )
    })
    await waitFor(() => {
      expect(listPrepTestPool).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 50, sort: "newest" }),
      )
    })
    await waitFor(() => {
      expect(screen.getAllByTestId(/preptest-list-row-/)).toHaveLength(55)
    })
    expect(screen.getByTestId("preptest-list-row-pt-901")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "See more" })).not.toBeInTheDocument()
  })

  it("shows unclickable availability text when tests pool is off", async () => {
    listPrepTestPool.mockResolvedValue({
      prepTests: [
        poolItem("pt-155", "155", {
          status: "completed",
          completedAt: "2026-08-06T00:00:00Z",
          scaledScore: 120,
          inDrills: false,
          inSections: true,
          inTests: false,
          attempts: [
            {
              sessionId: "sess-1",
              completedAt: "2026-08-06T00:00:00Z",
              scaledScore: 120,
              blindReviewScaledScore: null,
              attemptNumber: 1,
            },
          ],
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 5,
      statusCounts: { all: 1, fresh: 0, in_progress: 0, completed: 1, blind_review: 0 },
    })
    renderPage()
    expect(await screen.findByText("Available only for sections")).toBeInTheDocument()
    expect(screen.getByText("Section")).toBeInTheDocument()
    expect(screen.getByTestId("preptest-list-row-pt-155")).toHaveAttribute("data-muted", "true")
    expect(screen.queryByRole("button", { name: "Retake" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Start$/ })).not.toBeInTheDocument()
  })

  it("keeps Untimed Review CTA off the title row for in-process blind review cards", async () => {
    listPrepTestPool.mockResolvedValue({
      prepTests: [
        poolItem("pt-152", "152", {
          status: "in_progress",
          blindReviewStatus: "in_progress",
          openPrepTestSessionId: "sess-152",
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 5,
      statusCounts: { all: 1, fresh: 0, in_progress: 1, completed: 0, blind_review: 1 },
    })
    renderPage()

    const row = await screen.findByTestId("preptest-list-row-pt-152")
    expect(row).toHaveTextContent("In Process")
    expect(row.querySelector("p")?.textContent).toBe("In Process")
    const cta = Array.from(row.querySelectorAll("button")).find((button) => button.textContent === "Untimed Review")
    expect(cta).toBeTruthy()
    expect(cta?.className).toMatch(/whitespace-nowrap/)
    const actions = row.querySelector("[data-preptest-card-actions]")
    expect(actions).not.toBeNull()
    expect(actions).toContainElement(cta as HTMLElement)
    expect(actions?.className).toMatch(/col-span-2/)
    expect(actions?.textContent).not.toMatch(/In Process/)
  })

  it("renders completed score chrome and retake", async () => {
    listPrepTestPool.mockResolvedValue({
      prepTests: [
        poolItem("pt-122", "122", {
          status: "completed",
          completedAt: "2025-09-28T00:00:00Z",
          scaledScore: 139,
          blindReviewScaledScore: 139,
          attempts: [
            {
              sessionId: "sess-2",
              completedAt: "2025-09-28T00:00:00Z",
              scaledScore: 139,
              blindReviewScaledScore: 139,
              attemptNumber: 2,
            },
            {
              sessionId: "sess-1",
              completedAt: "2025-09-25T00:00:00Z",
              scaledScore: 139,
              blindReviewScaledScore: null,
              attemptNumber: 1,
            },
          ],
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 5,
      statusCounts: { all: 1, fresh: 0, in_progress: 0, completed: 1, blind_review: 0 },
    })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText("Completed")).toBeInTheDocument()
    expect(screen.getByTestId("preptest-list-row-pt-122").className).toMatch(/hover:bg-\[var\(--primary-25\)\]/)
    expect(screen.getByText("Score:")).toBeInTheDocument()
    expect(screen.getByText("Untimed Review:")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retake" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand attempt history" }))
    expect(screen.getByRole("button", { name: "Collapse attempt history" }).textContent).not.toMatch(/Score/)
    expect(screen.getByText("2nd take")).toBeInTheDocument()
    expect(screen.getAllByText("Score: 139")).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "Result" })).toHaveLength(2)
  })
})

describe("PracticePrepTestsListPage free plan", () => {
  it("locks every PrepTest and opens the upgrade modal on row click", async () => {
    const user = userEvent.setup()
    entitlementMock.entitlement.accessState = "PAYMENT_REQUIRED"
    entitlementMock.isPaymentRequired = true

    const items = [
      poolItem("pt-103", "103"),
      poolItem("pt-102", "102"),
      poolItem("pt-101", "101"),
    ]
    listPrepTestPool.mockImplementation((input: { pageSize?: number; sort?: PrepTestPoolSort } = {}) => {
      const pageSize = input.pageSize ?? 5
      const prepTests =
        input.sort === "oldest" ? [...items].reverse().slice(0, pageSize) : items.slice(0, pageSize)
      return Promise.resolve({
        prepTests,
        total: items.length,
        page: 1,
        pageSize,
        statusCounts: { all: 3, fresh: 3, in_progress: 0, completed: 0, blind_review: 0 },
      })
    })

    renderPage()

    expect(
      await screen.findByText(/Try a free PrepTest to gauge your starting point/i),
    ).toBeInTheDocument()

    for (const id of ["pt-103", "pt-102", "pt-101"]) {
      const row = await screen.findByTestId(`preptest-list-row-${id}`)
      expect(row).toHaveAttribute("data-locked", "true")
      expect(row.querySelector("[data-pt-lock-badge]")).toBeTruthy()
    }
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Subscribe Now" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Unlock PrepTest 103" }))
    expect(openLockedContentModal).toHaveBeenCalledWith("preptests")
  })
})
