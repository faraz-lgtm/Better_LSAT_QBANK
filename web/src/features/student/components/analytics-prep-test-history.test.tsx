import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { AnalyticsPrepTestHistory } from "@/features/student/components/analytics-prep-test-history"
import type { PrepTestHistoryEntry } from "@/features/student/lib/mock-analytics-preptests"

const entries: PrepTestHistoryEntry[] = [
  {
    id: "saved",
    testLabel: "Varied Mix",
    dateLabel: "Friday, Aug 28",
    bookmarked: true,
    score: 0,
    scoreMax: 5,
    blindReviewScore: 0,
    blindReviewMax: 5,
    sectionType: "LR",
  },
  {
    id: "plain",
    testLabel: "LR141B-4",
    dateLabel: "Thursday, Aug 27",
    bookmarked: false,
    score: 0,
    scoreMax: 25,
    blindReviewScore: 0,
    blindReviewMax: 25,
    sectionType: "LR",
  },
]

function HistoryHarness({
  initialEntries = entries,
}: {
  initialEntries?: PrepTestHistoryEntry[]
}) {
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [rows, setRows] = useState(initialEntries)
  const visible = bookmarkedOnly ? rows.filter((row) => row.bookmarked) : rows

  return (
    <AnalyticsPrepTestHistory
      title="Section History"
      emptyNoun="sections"
      visibleEntries={visible}
      bookmarkedOnly={bookmarkedOnly}
      onBookmarkedOnlyChange={setBookmarkedOnly}
      onToggleBookmark={(id) => {
        setRows((current) =>
          current.map((row) => (row.id === id ? { ...row, bookmarked: !row.bookmarked } : row)),
        )
      }}
    />
  )
}

describe("AnalyticsPrepTestHistory", () => {
  it("filters to bookmarked rows without crashing when the toggle turns on", async () => {
    const user = userEvent.setup()
    render(<HistoryHarness />)

    expect(screen.getByText("Varied Mix")).toBeInTheDocument()
    expect(screen.getByText("LR141B-4")).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Show bookmarked only" }))

    expect(screen.getByRole("switch", { name: "Show bookmarked only" })).toBeChecked()
    expect(screen.getByText("Varied Mix")).toBeInTheDocument()
    expect(screen.queryByText("LR141B-4")).not.toBeInTheDocument()
  })

  it("shows an empty state when nothing is bookmarked", async () => {
    const user = userEvent.setup()
    render(<HistoryHarness initialEntries={[entries[1]!]} />)

    await user.click(screen.getByRole("switch", { name: "Show bookmarked only" }))

    expect(screen.getByText(/No bookmarked sections/)).toBeInTheDocument()
  })

  it("toggles a row bookmark from its current filled state", async () => {
    const user = userEvent.setup()
    const onToggleBookmark = vi.fn()
    render(
      <AnalyticsPrepTestHistory
        visibleEntries={entries}
        bookmarkedOnly={false}
        onBookmarkedOnlyChange={() => {}}
        onToggleBookmark={onToggleBookmark}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Remove bookmark" }))
    expect(onToggleBookmark).toHaveBeenCalledWith("saved")
  })
})
