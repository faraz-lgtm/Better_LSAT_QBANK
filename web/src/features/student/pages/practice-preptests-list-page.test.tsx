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

function poolItem(id: string, number: string): PrepTestPoolItem {
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
  }
}

const newestFirst = [poolItem("pt-901", "901"), poolItem("pt-900", "900")]
const oldestFirst = [poolItem("pt-900", "900"), poolItem("pt-901", "901")]

function mockPool(sort: PrepTestPoolSort = "newest") {
  listPrepTestPool.mockImplementation((input: { sort?: PrepTestPoolSort } = {}) => {
    const requested = input.sort === "oldest" ? "oldest" : sort
    const prepTests = requested === "oldest" ? oldestFirst : newestFirst
    return Promise.resolve({
      prepTests,
      total: prepTests.length,
      page: 1,
      pageSize: 5,
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
  it("reloads the pool from Oldest to Newest when the sort control changes", async () => {
    const user = userEvent.setup()
    mockPool("newest")
    renderPage()

    expect(await screen.findByTestId("preptest-list-row-pt-901")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "In Process" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fresh" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Fresh \(\d+\)/ })).not.toBeInTheDocument()
    const rows = screen.getAllByTestId(/preptest-list-row-/)
    expect(rows.map((row) => row.getAttribute("data-testid"))).toEqual([
      "preptest-list-row-pt-901",
      "preptest-list-row-pt-900",
    ])

    await user.click(screen.getByRole("button", { name: "Sort PrepTests" }))
    await user.click(screen.getByRole("option", { name: "Oldest" }))

    await waitFor(() => {
      expect(listPrepTestPool).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "oldest", page: 1 }),
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
