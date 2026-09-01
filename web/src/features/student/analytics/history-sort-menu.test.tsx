import { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { HistorySortMenu } from "@/features/student/analytics/history-sort-menu"
import { sortHistoryEntries, type HistorySort } from "@/features/student/analytics/history-sort"

const rows = [
  { id: "new-low", takenAt: "2026-08-27T12:00:00Z", score: 2, scoreMax: 25 },
  { id: "old-high", takenAt: "2026-08-18T12:00:00Z", score: 22, scoreMax: 25 },
]

function Harness() {
  const [sort, setSort] = useState<HistorySort>("date-desc")
  const ordered = sortHistoryEntries(rows, sort)
  return (
    <div>
      <HistorySortMenu value={sort} onChange={setSort} ariaLabel="Sort PrepTest history" />
      <ul>
        {ordered.map((row) => (
          <li key={row.id}>{row.id}</li>
        ))}
      </ul>
    </div>
  )
}

describe("HistorySortMenu", () => {
  it("reorders rows when Highest score is chosen", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const labels = () => screen.getAllByRole("listitem").map((item) => item.textContent)
    expect(labels()).toEqual(["new-low", "old-high"])

    await user.click(screen.getByRole("button", { name: "Sort PrepTest history" }))
    await user.click(screen.getByRole("option", { name: "Highest score" }))

    expect(labels()).toEqual(["old-high", "new-low"])
    expect(screen.getByRole("button", { name: "Sort PrepTest history" })).toHaveTextContent(
      "Highest score",
    )
  })
})
