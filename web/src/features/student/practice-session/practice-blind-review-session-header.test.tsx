import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PracticeBlindReviewSessionHeader } from "@/features/student/practice-session/practice-blind-review-session-header"

describe("PracticeBlindReviewSessionHeader", () => {
  it("renders Figma exam chrome with Find Text, Notes, and exit", () => {
    render(
      <PracticeBlindReviewSessionHeader
        prepTestLabel="LSAT Praxis"
        sectionOptions={[]}
        activeSectionSessionId={null}
        onSelectSection={() => undefined}
        questionRef="Q1"
        actualScoreLabel="Actual: BR"
        notesOpen={false}
        notesEnabled
        onToggleNotes={() => undefined}
        onExitSection={() => undefined}
        findQuery=""
        onFindQueryChange={() => undefined}
        questionProgressLabel="1 of 26"
      />,
    )

    expect(screen.getByText("LSAT Praxis")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Find Text, Type Here")).toBeInTheDocument()
    expect(screen.getByText("1 of 26")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Notes" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Exit blind review" })).toBeInTheDocument()
    expect(screen.queryByText("Tools:")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Highlight" })).not.toBeInTheDocument()
    expect(screen.queryByRole("toolbar", { name: "Highlight tools" })).not.toBeInTheDocument()
  })
})
