import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { PracticePrepTestsListPage } from "@/features/student/pages/practice-preptests-list-page"
import type { PrepTestPoolItem, PrepTestPoolSort } from "@/features/student/preptests/preptest-types"

const { listPrepTestPool } = vi.hoisted(() => ({
  listPrepTestPool: vi.fn(),
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
    expect(screen.getByRole("button", { name: "Blind Review" })).toBeInTheDocument()
    expect(screen.getAllByText("Ready to Take")).toHaveLength(2)
    expect(screen.getByText("901").closest("[data-pt-badge]")).toHaveStyle({ width: "32px", height: "32px" })
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
    expect(screen.getByText("Blind Review:")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retake" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Expand attempt history" }))
    expect(screen.getByRole("button", { name: "Collapse attempt history" }).textContent).not.toMatch(/Score/)
    expect(screen.getByText("2nd take")).toBeInTheDocument()
    expect(screen.getAllByText("Score: 139")).toHaveLength(2)
    expect(screen.getAllByRole("button", { name: "Result" })).toHaveLength(2)
  })
})
