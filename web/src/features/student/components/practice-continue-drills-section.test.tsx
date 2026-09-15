import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PracticeContinueDrillsSection } from "@/features/student/components/practice-continue-drills-section"
import type { ContinueDrill } from "@/features/student/drills/drill-dashboard-mappers"

function drill(partial: Partial<ContinueDrill> & Pick<ContinueDrill, "id" | "section" | "title">): ContinueDrill {
  return {
    progressPct: 0,
    answered: "0/5",
    timeLabel: "—",
    lastAttempt: "Just now",
    accent: partial.section === "LR" ? "orange" : "mint",
    difficulty: "hardest",
    difficultyBars: 5,
    difficultyColor: "#df1c41",
    continuePath: `/app/practice/drills/session/${partial.id}`,
    ...partial,
  }
}

const noop = () => undefined

describe("PracticeContinueDrillsSection", () => {
  it("previews 3 drills per LR and RC section", () => {
    const lr = [1, 2, 3, 4].map((n) => drill({ id: `lr${n}`, section: "LR", title: `LR ${n}` }))
    const rc = [1, 2, 3, 4].map((n) => drill({ id: `rc${n}`, section: "RC", title: `RC ${n}` }))

    render(
      <PracticeContinueDrillsSection
        drills={[...lr, ...rc]}
        filter="all"
        onFilterChange={noop}
        lrExpanded={false}
        rcExpanded={false}
        onExpandLr={noop}
        onCollapseLr={noop}
        onExpandRc={noop}
        onCollapseRc={noop}
        onContinue={noop}
        loading={false}
        difficultyLabelFromContinue={() => "Hardest"}
      />,
    )

    expect(screen.getByRole("heading", { name: "Logical Reasoning" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Reading Comprehension" })).toBeInTheDocument()
    expect(screen.getByText("LR 3")).toBeInTheDocument()
    expect(screen.queryByText("LR 4")).not.toBeInTheDocument()
    expect(screen.getByText("RC 3")).toBeInTheDocument()
    expect(screen.queryByText("RC 4")).not.toBeInTheDocument()
    expect(screen.getByText("08 In process")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "See more" })).toHaveLength(2)
    expect(screen.queryByText("No More")).not.toBeInTheDocument()
    expect(screen.getAllByLabelText("LR")).toHaveLength(1)
    expect(screen.getAllByLabelText("RC")).toHaveLength(1)
  })

  it("toggles to RC only beside the in-process count", async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    render(
      <PracticeContinueDrillsSection
        drills={[
          drill({ id: "lr1", section: "LR", title: "LR one" }),
          drill({ id: "rc1", section: "RC", title: "RC one" }),
        ]}
        filter="all"
        onFilterChange={onFilterChange}
        lrExpanded={false}
        rcExpanded={false}
        onExpandLr={noop}
        onCollapseLr={noop}
        onExpandRc={noop}
        onCollapseRc={noop}
        onContinue={noop}
        loading={false}
        difficultyLabelFromContinue={() => "Hardest"}
      />,
    )

    await user.click(screen.getByRole("tab", { name: "RC" }))
    expect(onFilterChange).toHaveBeenCalledWith("rc")
  })

  it("offers See less after a section is expanded", async () => {
    const user = userEvent.setup()
    const onCollapseLr = vi.fn()
    const lr = [1, 2, 3, 4].map((n) => drill({ id: `lr${n}`, section: "LR", title: `LR ${n}` }))

    render(
      <PracticeContinueDrillsSection
        drills={lr}
        filter="lr"
        onFilterChange={noop}
        lrExpanded
        rcExpanded={false}
        onExpandLr={noop}
        onCollapseLr={onCollapseLr}
        onExpandRc={noop}
        onCollapseRc={noop}
        onContinue={noop}
        loading={false}
        difficultyLabelFromContinue={() => "Hardest"}
      />,
    )

    expect(screen.getByText("LR 4")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "See less" }))
    expect(onCollapseLr).toHaveBeenCalled()
  })
})
