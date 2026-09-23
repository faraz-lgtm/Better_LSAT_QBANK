import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  PracticeTagDrillsSections,
  type TagDrill,
} from "@/features/student/components/practice-tag-drills-sections"

function drill(partial: Partial<TagDrill> & Pick<TagDrill, "id" | "section" | "title">): TagDrill {
  return {
    questionTypeId: partial.id,
    difficultyLabel: "Hardest",
    filledBars: 5,
    difficultyColor: "#df1c41",
    configPath: `/app/practice/drills/${partial.section.toLowerCase()}/new`,
    ...partial,
  }
}

describe("PracticeTagDrillsSections", () => {
  it("renders separate LR and RC lists with section headings", () => {
    render(
      <PracticeTagDrillsSections
        lr={[drill({ id: "lr1", section: "LR", title: "Flaw" })]}
        rc={[drill({ id: "rc1", section: "RC", title: "Comparative" })]}
        visibleSections={["lr", "rc"]}
        onStart={() => undefined}
        loading={false}
      />,
    )

    expect(screen.getByRole("heading", { name: "Drill by Types (LR)" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Drill by Types (RC)" })).toBeInTheDocument()
    expect(screen.getByText("Flaw")).toBeInTheDocument()
    expect(screen.getByText("Comparative")).toBeInTheDocument()
    expect(screen.getAllByText("Your top 3 weakest types in this section")).toHaveLength(2)
    expect(screen.getAllByText("Hardest").length).toBeGreaterThan(0)
    expect(screen.queryByText("High")).not.toBeInTheDocument()
    expect(screen.queryByText("Low")).not.toBeInTheDocument()
    const lrCta = screen.getByRole("button", { name: /start lr drill/i })
    const rcCta = screen.getByRole("button", { name: /start rc drill/i })
    expect(lrCta).toHaveClass("w-[176px]", "whitespace-nowrap")
    expect(rcCta).toHaveClass("w-[176px]", "whitespace-nowrap")
  })

  it("expands beyond the top 3 weakest after See more", async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    const lr = ["Flaw", "Necessary Assumption", "Strengthen", "Weaken"].map((title, i) =>
      drill({ id: `lr${i}`, section: "LR", title }),
    )

    render(
      <PracticeTagDrillsSections
        lr={lr}
        rc={[]}
        visibleSections={["lr", "rc"]}
        onStart={onStart}
        loading={false}
      />,
    )

    expect(screen.getByText("Flaw")).toBeInTheDocument()
    expect(screen.getByText("Necessary Assumption")).toBeInTheDocument()
    expect(screen.getByText("Strengthen")).toBeInTheDocument()
    expect(screen.queryByText("Weaken")).not.toBeInTheDocument()
    expect(screen.getByText("Your top 3 weakest types in this section")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "See more" }))

    expect(screen.getByText("Weaken")).toBeInTheDocument()
    expect(screen.getByText("Your top priority types in this section")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "See less" })).toBeInTheDocument()
  })

  it("caps See more at 8 drills per LR/RC section", async () => {
    const user = userEvent.setup()
    const lr = Array.from({ length: 12 }, (_, i) =>
      drill({ id: `lr${i}`, section: "LR", title: `LR Type ${i + 1}` }),
    )
    const rc = Array.from({ length: 12 }, (_, i) =>
      drill({ id: `rc${i}`, section: "RC", title: `RC Type ${i + 1}` }),
    )

    render(
      <PracticeTagDrillsSections
        lr={lr}
        rc={rc}
        visibleSections={["lr", "rc"]}
        onStart={() => undefined}
        loading={false}
      />,
    )

    const seeMoreButtons = screen.getAllByRole("button", { name: "See more" })
    expect(seeMoreButtons).toHaveLength(2)
    await user.click(seeMoreButtons[0]!)
    await user.click(seeMoreButtons[1]!)

    expect(screen.getByText("LR Type 8")).toBeInTheDocument()
    expect(screen.queryByText("LR Type 9")).not.toBeInTheDocument()
    expect(screen.getByText("RC Type 8")).toBeInTheDocument()
    expect(screen.queryByText("RC Type 9")).not.toBeInTheDocument()
    expect(screen.getAllByText("Your top priority types in this section")).toHaveLength(2)
  })

  it("hides a section when the page filter excludes it", () => {
    render(
      <PracticeTagDrillsSections
        lr={[drill({ id: "lr1", section: "LR", title: "Flaw" })]}
        rc={[drill({ id: "rc1", section: "RC", title: "Main Point" })]}
        visibleSections={["lr"]}
        onStart={() => undefined}
        loading={false}
      />,
    )

    expect(screen.getByRole("heading", { name: "Drill by Types (LR)" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Drill by Types (RC)" })).not.toBeInTheDocument()
    expect(screen.queryByText("Main Point")).not.toBeInTheDocument()
  })
})
